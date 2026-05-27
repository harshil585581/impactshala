import { useState } from "react";
import PromoCard from "./PromoCard";
import HelpBox from "./HelpBox";

export default function DiscoverSidePanel() {
  const [helpVisible, setHelpVisible] = useState(true);

  return (
    <div className="flex flex-col gap-4 w-[354px]">
      <PromoCard />
      {helpVisible && <HelpBox onDismiss={() => setHelpVisible(false)} />}
    </div>
  );
}
