import { Link } from "react-router-dom";
import AppauraLogo from "../../../assets/appauralogos.png";

export default function AuthLayout({
  children,
  title,
  subtitle,
  heroTitle = "Optimize Inventory and Logistics",
  footerText,
  footerLinkText,
  onFooterLinkClick,
  logoLink = "/",
  wide = false,
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div
        className={`w-full ${
          wide ? "lg:w-[60%]" : "lg:w-1/2"
        } flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8`}
      >
        <div className={`${wide ? "max-w-3xl" : "max-w-md"} w-full space-y-8`}>
          {/* Logo and Header */}
          <div>
            <Link to={logoLink}>
              <img src={AppauraLogo} alt="AppAura" className="h-12 mb-8" />
            </Link>
            {title && (
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
            )}
            {subtitle && <p className="text-gray-600">{subtitle}</p>}
          </div>

          {/* Content (Form) */}
          <div>{children}</div>

          {/* Footer Link */}
          {footerText && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {footerText}{" "}
                <button
                  onClick={onFooterLinkClick}
                  className="font-medium text-primary/70 hover:text-primary hover:underline cursor-pointer"
                >
                  {footerLinkText}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>

    <div
  className={`hidden lg:flex ${
    wide ? "lg:w-[40%]" : "lg:w-1/2"
  } bg-white items-center justify-center p-12 relative overflow-hidden`}
>
        <div className={`relative z-10 ${wide ? "max-w-sm" : "max-w-xl"}`}>
          {/* Image Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Top Left */}
            <div className="col-span-1 row-span-1 rounded-3xl overflow-hidden shadow-lg bg-white">
              <img
                src="https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&h=300&fit=crop"
                alt="Warehouse"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Top Right */}
            <div className="col-span-1 row-span-1 rounded-3xl overflow-hidden shadow-lg bg-blue-100">
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop"
                alt="Warehouse Shelves"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Center Circle */}
            <div className="col-span-2 flex items-center justify-center -mt-16 -mb-16 relative">
            <div className={`${wide ? "w-52 h-52" : "w-64 h-64"} rounded-full bg-[#30426B] flex items-center justify-center shadow-2xl`}>
  <h3 className={`${wide ? "text-lg" : "text-2xl"} font-bold text-white text-center px-8`}>

                  {heroTitle}
                </h3>
              </div>
            </div>

            {/* Bottom Left */}
            <div className="col-span-1 row-span-1 rounded-3xl overflow-hidden shadow-lg bg-white">
              <img
                src="https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=400&h=300&fit=crop"
                alt="Warehouse Floor"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Bottom Right */}
            <div className="col-span-1 row-span-1 rounded-3xl overflow-hidden shadow-lg bg-white">
              <img
                src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop"
                alt="Control Room"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200 rounded-full opacity-20 blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full opacity-20 blur-3xl -z-10"></div>
        </div>
      </div>
    </div>
  );
}