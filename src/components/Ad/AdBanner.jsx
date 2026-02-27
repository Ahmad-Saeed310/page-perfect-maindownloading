import { useEffect, useRef } from "react";

const AdBanner = ({
  adClient = "ca-pub-1165028160233098",
  adSlot = "4048800768",
  width = 728,
  height = 90,
  style = {},
}) => {
  const adRef = useRef(false);

  useEffect(() => {
    if (adRef.current) return;
    adRef.current = true;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{
        display: "inline-block",
        width: `${width}px`,
        height: `${height}px`,
        ...style,
      }}
      data-ad-client={adClient}
      data-ad-slot={adSlot}
    />
  );
};

export default AdBanner;