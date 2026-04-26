import { useForm } from "react-hook-form";
import { FiUploadCloud, FiAlertCircle, FiX, FiDownload } from "react-icons/fi";
import { csvUploadSchema } from "../../common/form/validations/DataIngestionSchemas";
import { yupResolver } from "@hookform/resolvers/yup";
import axios from "axios";
import { apiEndpoints } from "../../../services/apiEndpoints";
import { useAuth } from "../../auth/hooks/useAuth";
import { getToken } from "../../../services/tokenUtils";
import { useState, useEffect, useRef } from "react";
import HomeTable from "../../common/table/Table";
import HeaderWithSort from "../../common/table/components/TableHeaderWithSort";
import { MessageAlert } from "../../common/message/MessageAlert";

export default function CsvUpload({ onComplete }) {
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const { user } = useAuth();
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [filters, setFilters] = useState({
    fromDate: null,
    toDate: null,
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("Uploaded Files History-filters");
    if (saved) setFilters(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "Uploaded Files History-filters",
      JSON.stringify(filters),
    );
  }, [filters]);

  const methods = useForm({
    resolver: yupResolver(csvUploadSchema),
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const { setValue, watch, reset } = methods;
  const files = watch("files");

  useEffect(() => {
    fetchHistory(filters.fromDate, filters.toDate);
  }, [filters.fromDate, filters.toDate]);

  const fetchHistory = async (fromDate, toDate) => {
    try {
      setHistoryLoading(true);
      const token = getToken();
      if (!token) throw new Error("No token. Please log in.");

      const url = apiEndpoints.trackFilesHistory(
        fromDate ? `${fromDate}T00:00:00Z` : "",
        toDate ? `${toDate}T23:59:59Z` : "",
      );

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        timeout: 20000,
      });

      setHistoryData(
        Array.isArray(response.data.data) ? response.data.data : [],
      );
      setHistoryError(null);
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Failed to load history.";
      setHistoryError(msg);
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleFilesSelection = (selectedFiles) => {
    if (!selectedFiles?.length) {
      reset();
      return;
    }
    const filesArray = Array.from(selectedFiles);
    if (filesArray.some((f) => f.size === 0)) {
      setError("File is empty");
      return;
    }
    if (filesArray.length > 5) {
      setError("Max 5 files allowed");
      return;
    }
    const fileList = new DataTransfer();
    filesArray.forEach((f) => fileList.items.add(f));
    setValue("files", fileList.files, { shouldValidate: true });
    setError("");
  };

  const handleFileUpload = async () => {
    if (!files?.length) return setError("Select files to upload");
    if (files.length > 5) return setError("Max 5 files");

    setUploading(true);
    setError("");
    setSuccessMessage("");
    setUploadProgress({ total: 0 });

    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));

    try {
      const token = getToken();
      if (!token) throw new Error("No token");

      const response = await axios.post(apiEndpoints.uploadCsv, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
          "ngrok-skip-browser-warning": "true",
        },
        onUploadProgress: (e) => {
          if (e.total) {
            const progress = Math.round((e.loaded * 100) / e.total);
            setUploadProgress({ total: progress });
          }
        },
        timeout: 30000,
      });

      setSuccessMessage(`Uploaded ${files.length} file(s)!`);
      onComplete?.("Upload successful");
      reset();
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploadProgress({ total: 100 });

      setTimeout(() => setSuccessMessage(""), 3000);
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const historyColumns = [
    {
      accessorKey: "fileName",
      header: ({ column }) => (
        <HeaderWithSort column={column} title="File Name" />
      ),
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "fileType",
      header: ({ column }) => (
        <HeaderWithSort column={column} title="File Type" />
      ),
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "fileSize",
      header: ({ column }) => (
        <HeaderWithSort column={column} title="File Size" />
      ),
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <HeaderWithSort column={column} title="Status" />,
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "uploadDate",
      header: ({ column }) => (
        <HeaderWithSort column={column} title="Upload Date" />
      ),
      cell: ({ getValue }) =>
        new Date(getValue()).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
  ];

  const filterFields = [
    {
      type: "dateRange",
      label: "Upload Date",
      fromName: "fromDate",
      toName: "toDate",
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade { animation: fadeIn 0.5s ease-out; }
        .hover-lift { transition: 
          transform 0.2s, 
          box-shadow 0.2s; 
        }
        .hover-lift:hover { 
          transform: translateY(-2px); 
          // box-shadow: 0 8px 20px rgba(0,0,0,0.1); 
          }
        
      `}</style>

      {/* UPLOAD SECTION - CENTERED */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg animate-fade">
            <FiAlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg animate-fade">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        {/* Upload Zone */}
        <div
          className="border border-dashed border-gray-300 rounded-2xl bg-gray-50 p-8 hover:border-blue-400 transition-colors"
          onDrop={(e) => {
            e.preventDefault();
            handleFilesSelection(e.dataTransfer.files);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="p-4 bg-white rounded-full shadow-md">
              <FiUploadCloud className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">
              Drop CSV Files Here
            </h3>
            <p className="text-sm text-gray-600">
              or click to browse (max 5 files, .csv only)
            </p>

            {/* SAMPLE DOWNLOAD */}
            <a
              href="/sample/sample_upload.csv"
              download="sample_upload.csv"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all hover-lift shadow-md"
            >
              <FiDownload className="w-4 h-4" />
              Download Sample CSV
            </a>

            <label
              htmlFor="file-input"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
            >
              Choose Files
              <input
                id="file-input"
                type="file"
                accept=".csv"
                multiple
                ref={fileInputRef}
                onChange={(e) => handleFilesSelection(e.target.files)}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Selected Files */}
        {files?.length > 0 && (
          <div className="space-y-3">
            <div className="space-y-2">
              {Array.from(files).map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      ></path>
                    </svg>
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {file.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <button
                      onClick={() =>
                        handleFilesSelection(
                          Array.from(files).filter((_, idx) => idx !== i),
                        )
                      }
                      className="text-gray-500 hover:text-red-600"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleFileUpload}
                disabled={uploading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all hover-lift"
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Uploading... {uploadProgress.total || 0}%
                  </span>
                ) : (
                  "Upload Files"
                )}
              </button>

              {uploading && (
                <div className="w-full max-w-sm">
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${uploadProgress.total || 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-center text-gray-600 mt-1">
                    {files.length} file{files.length > 1 ? "s" : ""}{" "}
                    uploading...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* TABLE - FULL WIDTH */}
      <div className="mt-10 w-full">
        {historyError ? (
          <MessageAlert
            variant="error"
            message={historyError}
            onClose={() => setHistoryError(null)}
            action={fetchHistory}
            actionLabel="Retry"
          />
        ) : (
          <HomeTable
            title="Uploaded Files History"
            data={historyData}
            columns={historyColumns}
            filterFields={filterFields}
            filters={filters}
            onFilterChange={(name, value) =>
              setFilters((prev) => ({ ...prev, [name]: value }))
            }
            searchField="fileName"
            loading={historyLoading}
            serverSideFiltering={true}
          />
        )}
      </div>
    </div>
  );
}
