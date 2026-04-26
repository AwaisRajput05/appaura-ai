import React, { useMemo, useState, useEffect } from 'react';
import {
  FiSend,
  FiMessageCircle,
  FiUser,
  FiSmartphone,
  FiBarChart2,
  FiTrendingUp,
  FiAlertCircle,
} from 'react-icons/fi';
import { apiEndpoints } from '../../../../services/apiEndpoints';
import { getToken } from '../../../../services/tokenUtils';
import apiService from '../../../../services/apiService';
import { useAuth } from '../../../../components/auth/hooks/useAuth';
import {
  ERROR_429,
  ERROR_401,
  ERROR_403,
  ERROR_500,
  ERROR_503,
} from '../../../../components/constants/Messages';

function Chatbot() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Reset to first page when new data arrives
  useEffect(() => {
    setCurrentPage(1);
  }, [tableData]);

  // Derive dynamic columns from union of keys across rows
  const tableColumns = useMemo(() => {
    if (!Array.isArray(tableData) || tableData.length === 0) return [];
    const orderedKeys = new Set();
    for (const row of tableData) {
      if (row && typeof row === 'object') {
        Object.keys(row).forEach((k) => orderedKeys.add(k));
      }
    }
    return Array.from(orderedKeys);
  }, [tableData]);

  const normalizedSearch = tableSearch.trim().toLowerCase();
  const filteredData = useMemo(() => {
    if (!Array.isArray(tableData)) return [];
    if (!normalizedSearch) return tableData;
    return tableData.filter((row) =>
      tableColumns.some((col) =>
        String(row?.[col] ?? '')
          .toLowerCase()
          .includes(normalizedSearch)
      )
    );
  }, [tableData, tableColumns, normalizedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const pageStartIndex = (currentPage - 1) * pageSize;
  const currentPageRows = useMemo(
    () => filteredData.slice(pageStartIndex, pageStartIndex + pageSize),
    [filteredData, pageStartIndex, pageSize]
  );

  const formatHeader = (key) =>
    key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const isDateLike = (val) =>
    typeof val === 'string' && /\d{4}-\d{2}-\d{2}/.test(val);
  const shouldFormatCurrency = (key) => /price|amount|total|spend/i.test(key);
  const formatValue = (key, val) => {
    if (val === null || val === undefined || val === '') return '-';
    if (isDateLike(val)) {
      const d = new Date(val);
      return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString();
    }
    if (typeof val === 'number' && shouldFormatCurrency(key)) {
      return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(val);
    }
    return String(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    const userMessage = { type: 'user', content: query, timestamp: new Date() };
    setChatHistory((prev) => [...prev, userMessage]);

    try {
      const token = getToken();
      const encodedQuery = encodeURIComponent(query);
      if (!user?.userId) {
        throw new Error(
          "User ID not found. Please ensure you're properly logged in."
        );
      }
      const url = apiEndpoints.chatbotResponse(user.userId) + encodedQuery;

      const { data } = await apiService.get(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          Accept: 'application/json',
        },
      });

      let responseContent = '';
      let isError = false;

      if (data?.data?.results) {
        if (Array.isArray(data.data.results)) {
          if (data.data.results.length === 0) {
            responseContent = 'Data not found. Try something else.';
            isError = true;
            setShowTable(false);
            setTableData([]);
          } else {
            responseContent = `Found ${data.data.results.length} transactions. Data is displayed in the table below.`;
            setTableData(data.data.results);
            setShowTable(true);
          }
        } else {
          responseContent = 'Invalid data format received.';
          isError = true;
          setShowTable(false);
          setTableData([]);
        }
      } else if (data.status === 'success') {
        responseContent = data.message || 'No data available for this query.';
        isError = false;
        setShowTable(false);
        setTableData([]);
      } else {
        isError = true;
        const errorMsg = data.message || 'Request failed';
        setShowTable(false);
        setTableData([]);

        if (
          errorMsg.toLowerCase().includes('not found') ||
          errorMsg.toLowerCase().includes('no data')
        ) {
          responseContent = 'Data not found. Try something else.';
        } else if (
          errorMsg.toLowerCase().includes('invalid') ||
          errorMsg.toLowerCase().includes('syntax')
        ) {
          responseContent =
            "I didn't understand your query. Try a different question.";
        } else if (
          errorMsg.toLowerCase().includes('unauthorized') ||
          errorMsg.toLowerCase().includes('permission')
        ) {
          responseContent =
            "You don't have permission to access this data. Please contact your administrator or try a different query.";
        } else {
          responseContent = `${errorMsg}`;
        }
      }

      const botMessage = {
        type: 'bot',
        content: responseContent,
        timestamp: new Date(),
        isError: isError,
      };
      setChatHistory((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Error:', err);
      setShowTable(false);
      setTableData([]);

      let errorMessage = '';
      if (!err.response) {
        errorMessage =
          'Unable to connect to the server. Please check your internet connection or try again later.';
      } else {
        switch (err.response.status) {
          case 429:
            errorMessage = ERROR_429;
            break;
          case 503:
            errorMessage = ERROR_503;
            break;
          case 401:
            errorMessage = ERROR_401;
            break;
          case 403:
            errorMessage = ERROR_403;
            break;
          case 500:
            errorMessage = ERROR_500;
            break;
          default:
            errorMessage =
              err.response.data?.message ||
              'An unknown error occurred while processing your request.';
        }
      }

      const errorMsg = {
        type: 'bot',
        content: errorMessage,
        timestamp: new Date(),
        isError: true,
      };
      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setQuery('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const [showAll, setShowAll] = useState(false);

  const suggestions = [
    'List customers who shopped on June 15',
    "Find customer CEL's details",
    '050 Give me customers with total spend above 50',
    'Show customers whose name contains CEL',
    'Show transactions for customer CEL on June 15',
    'List transactions from store 11 on June 16',
    'Find all purchases made after June 14',
    'List purchases of fries in June',
    'Show products with full price above 10',
    'Show customers who bought fries on June 15',
    'Find purchases for product fries by customer CEL',
    'June 2015 List all products purchased at store 2 on June 15',
    'Show products bought at store 11 on June 15',
    'List transactions for fries after June 10',
    'Show transactions for fries before June 20',
    'Find all purchases for fries',
  ];

  const displayedSuggestions = showAll ? suggestions : suggestions.slice(0, 5);

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-full">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#566a96] to-[#3069FE] rounded-full mb-4">
            <FiMessageCircle className="text-white text-2xl" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#566a96] to-[#3069FE] bg-clip-text text-transparent mb-2">
            AI Assistant
          </h1>
          <p className="text-gray-600 text-lg">
            Ask me anything about your analytics and business data
          </p>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-[#566a96] to-[#3069FE]  px-6 py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <FiSmartphone className="text-white text-lg" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">
                  Analytics Assistant
                </h3>
                <p className="text-blue-100 text-sm">Powered by AI</p>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="h-80 overflow-y-auto p-6 space-y-4">
            {chatHistory.length === 0 ? (
              <div className="text-center py-5">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <FiMessageCircle className="text-gray-400 text-2xl" />
                </div>
                <h3 className="text-gray-500 font-medium mb-2">
                  Start a conversation
                </h3>
                <p className="text-gray-400 text-sm mb-3">
                  Ask me about your business data and analytics
                </p>
                <div className="text-xs text-gray-400">
                  <p>Examples:</p>
                  <p>• "Show top 5 products by revenue"</p>
                  <p>• "List transactions for specific product"</p>
                  <p>• "Customer analytics this month"</p>
                </div>
              </div>
            ) : (
              chatHistory.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                        : message.isError
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.type === 'bot' &&
                        (message.isError ? (
                          <FiAlertCircle className="text-red-500 mt-1 flex-shrink-0" />
                        ) : (
                          <FiSmartphone className="text-gray-500 mt-1 flex-shrink-0" />
                        ))}
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <p
                          className={`text-xs mt-2 ${
                            message.type === 'user'
                              ? 'text-blue-100'
                              : message.isError
                              ? 'text-red-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      {message.type === 'user' && (
                        <FiUser className="text-blue-100 mt-1 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 max-w-xs lg:max-w-md px-4 py-3 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <FiSmartphone className="text-gray-500" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-100 p-6">
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about your analytics data..."
                  className="w-full px-4 py-3 pr-12 border border-[#1E293B] rounded-xl focus:outline-[#1E293B] focus:ring-2 focus:ring-[#1E293B] focus:border-transparent transition-all duration-200"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="absolute right-2 top-3 transform -translate-y-1/2 p-2 text-gray-400 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FiSend className="text-lg" />
                </button>
              </div>
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="px-6 py-3 bg-gradient-to-r from-[#566a96] to-[#3069FE] cursor-pointer text-white rounded-xl font-medium hover:from-[#566a96] hover:to-[#3069FE] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </form>

            {/* Quick Suggestions */}
            <div className="mt-4 flex flex-col gap-2">
              <div className="w-full text-xs text-gray-500 mb-2">
                Try these examples:
              </div>

              <div className="flex flex-wrap gap-2">
                {displayedSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(suggestion)}
                    className="px-3 py-1 text-sm bg-gray-100 cursor-pointer text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {suggestions.length > 5 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="mt-2 self-start text-sm text-blue-500 cursor-pointer hover:underline"
                >
                  {showAll ? 'See Less' : 'See More'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Data Table */}
        {showTable && tableData.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#566a96] to-[#3069FE] px-6 py-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
                  <FiBarChart2 className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Results</h3>
                  <p className="text-blue-100 text-sm">
                    {filteredData.length} records · {tableColumns.length}{' '}
                    columns
                  </p>
                </div>
              </div>
            </div>

            {/* Search bar */}
            <div className="py-4 border-b border-gray-100 flex items-center gap-3">
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search in table..."
                className="w-full px-4 py-2 border border-[#1E293B] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full rounded-lg border-[#1E293B] border">
                <thead className="bg-gradient-to-r from-[#566a96] to-[#3069FE] rounded-t-lg">
                  <tr>
                    <th className="px-2 py-4 text-left text-sm underline font-medium text-white uppercase tracking-wider">
                      #
                    </th>
                    {tableColumns.map((key) => (
                      <th
                        key={key}
                        className="px-2 py-4 text-left text-sm underline font-medium text-white uppercase tracking-tighter"
                      >
                        {formatHeader(key)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentPageRows.map((row, index) => (
                    <tr
                      key={index}
                      className={`${
                        index % 2 === 0
                          ? 'bg-white hover:bg-blue-50'
                          : 'text-[#1E293B]'
                      } text-[#1E293B] bg-[#566a96]/20`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {pageStartIndex + index + 1}
                      </td>
                      {tableColumns.map((key) => (
                        <td
                          key={key}
                          className="px-6 py-4 whitespace-nowrap text-sm"
                        >
                          {formatValue(key, row?.[key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer with pagination */}
            <div className="bg-gray-50 px-2 py-4 border-t border-gray-200">
              <div className="flex flex-col justify-center items-center flex-wrap xl:flex-nowrap md:flex-row md:items-center xl:justify-between gap-3">
                <div className="text-sm text-gray-600">
                  Showing {filteredData.length === 0 ? 0 : pageStartIndex + 1}-
                  {Math.min(
                    pageStartIndex + currentPageRows.length,
                    filteredData.length
                  )}{' '}
                  of {filteredData.length}
                </div>
                <div className="text-sm text-gray-600">
                  Total Amount (filtered):{' '}
                  <span className="font-semibold text-green-600">
                    $
                    {filteredData
                      .reduce(
                        (sum, item) => sum + (parseFloat(item.total) || 0),
                        0
                      )
                      .toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-gray-200 rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-gray-200 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chatbot;
