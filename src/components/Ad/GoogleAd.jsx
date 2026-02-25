import { useEffect, useRef } from "react";

const GoogleAd = ({ adClient, adSlot, style, className }) => {
  const adRef = useRef(null);
  const isAdPushed = useRef(false);

  useEffect(() => {
    // Only push if not already initialized and the element is in the DOM
    if (isAdPushed.current || !adRef.current) return;

    // Use IntersectionObserver to only load ad when visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isAdPushed.current) {
            isAdPushed.current = true;
            try {
              (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (err) {
              console.log("AdSense push error:", err);
            }
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(adRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle ${className || ""}`}
      style={{
        display: "block",
        minHeight: "90px",
        width: "100%",
        backgroundColor: "#f3f3f3",
        ...style,
      }}
      data-ad-client={adClient || "ca-pub-1165028160233098"}
      data-ad-slot={adSlot || "7760276067"}
      data-ad-format="auto"
      data-full-width-responsive="true"
      data-adtest="on"
    />
  );
};

export default GoogleAd;
