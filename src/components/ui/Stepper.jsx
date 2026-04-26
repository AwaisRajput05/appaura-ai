// Alternative simpler version using flex
const Stepper = ({ steps, currentStep, completedSteps }) => {
  const stepTitles = steps.map(step => 
    typeof step === 'string' ? step : step.title
  );

  // Find the index of the last completed step
  const getActiveIndex = () => {
    if (completedSteps.length === 0) return -1;
    return Math.max(...completedSteps.map(title => stepTitles.indexOf(title)));
  };

  const activeIndex = getActiveIndex();

  return (
    <div className="flex items-center justify-between relative px-4">
      {/* Background line */}
      <div className="absolute top-5 left-10 right-10 h-1 bg-gray-200"></div>
      
      {/* Progress line */}
      <div 
        className="absolute top-5 left-10 h-1 bg-green-500 transition-all duration-500"
        style={{
          width: activeIndex >= 0 
            ? `${(activeIndex / (stepTitles.length - 1)) * 80}%` 
            : '0%'
        }}
      ></div>

      {stepTitles.map((title, index) => (
        <div 
          key={title} 
          className="flex flex-col items-center z-10 flex-1"
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              currentStep === title
                ? "bg-[#3C5690] text-white shadow-lg scale-110"
                : completedSteps.includes(title)
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {completedSteps.includes(title) ? (
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              index + 1
            )}
          </div>
          <p className="mt-2 text-xs text-gray-600 text-center px-1">
            {title}
          </p>
        </div>
      ))}
    </div>
  );
};
export default Stepper;