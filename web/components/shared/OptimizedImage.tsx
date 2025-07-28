import Image, { ImageProps } from "next/image";
import { useState, useRef, useEffect } from "react";
import { useLazyLoad } from "../../hooks/useOptimizedState";

interface OptimizedImageProps extends Omit<ImageProps, "onLoad" | "onError"> {
  fallbackSrc?: string;
  showLoadingSpinner?: boolean;
  enableLazyLoad?: boolean;
  lazyLoadThreshold?: number;
  onLoadComplete?: () => void;
  onError?: () => void;
}

export const OptimizedImage = ({
  src,
  alt,
  fallbackSrc,
  showLoadingSpinner = true,
  enableLazyLoad = true,
  lazyLoadThreshold = 0.1,
  onLoadComplete,
  onError,
  className = "",
  ...props
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const { ref, isVisible } = useLazyLoad(lazyLoadThreshold);

  // Reset state when src changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setCurrentSrc(src);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoadComplete?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
    } else {
      onError?.();
    }
  };

  // Don't render image until it's visible (if lazy loading is enabled)
  const shouldRenderImage = !enableLazyLoad || isVisible;

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {shouldRenderImage ? (
        <>
          <Image
            {...props}
            src={currentSrc}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            className={`transition-opacity duration-300 ${
              isLoading ? "opacity-0" : "opacity-100"
            }`}
            priority={!enableLazyLoad}
            quality={75}
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZjNmNGY2O3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjUwJSIgc3R5bGU9InN0b3AtY29sb3I6I2U1ZTdlYjtzdG9wLW9wYWNpdHk6MSIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZjNmNGY2O3N0b3Atb3BhY2l0eToxIiAvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9InVybCgjZ3JhZGllbnQpIiAvPgo8L3N2Zz4K"
          />
          
          {/* Loading spinner */}
          {isLoading && showLoadingSpinner && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          )}
          
          {/* Error state */}
          {hasError && !fallbackSrc && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">Failed to load image</p>
              </div>
            </div>
          )}
        </>
      ) : (
        // Placeholder for lazy loading
        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 dark:text-gray-500 text-sm">Loading...</div>
        </div>
      )}
    </div>
  );
};

// Optimized avatar component
interface OptimizedAvatarProps {
  src?: string;
  alt: string;
  size?: number;
  fallbackInitials?: string;
  className?: string;
}

export const OptimizedAvatar = ({
  src,
  alt,
  size = 40,
  fallbackInitials,
  className = "",
}: OptimizedAvatarProps) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gray-300 dark:bg-gray-600 ${className}`}
      style={{ width: size, height: size }}
    >
      {src && !hasError ? (
        <OptimizedImage
          src={src}
          alt={alt}
          fill
          className="object-cover"
          onError={() => setHasError(true)}
          enableLazyLoad={false}
          showLoadingSpinner={false}
        />
      ) : (
        <span className="text-gray-600 dark:text-gray-300 font-medium" style={{ fontSize: size * 0.4 }}>
          {fallbackInitials || alt.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
};

// Progressive image loading component
interface ProgressiveImageProps extends OptimizedImageProps {
  lowQualitySrc?: string;
}

export const ProgressiveImage = ({
  src,
  lowQualitySrc,
  ...props
}: ProgressiveImageProps) => {
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

  return (
    <div className="relative">
      {/* Low quality image */}
      {lowQualitySrc && !isHighQualityLoaded && (
        <OptimizedImage
          {...props}
          src={lowQualitySrc}
          className={`absolute inset-0 ${props.className || ""}`}
          enableLazyLoad={false}
          quality={10}
        />
      )}
      
      {/* High quality image */}
      <OptimizedImage
        {...props}
        src={src}
        onLoadComplete={() => {
          setIsHighQualityLoaded(true);
          props.onLoadComplete?.();
        }}
        className={`transition-opacity duration-500 ${
          isHighQualityLoaded ? "opacity-100" : "opacity-0"
        } ${props.className || ""}`}
      />
    </div>
  );
};