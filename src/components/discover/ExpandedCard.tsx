import type { DiscoverItem } from "../../services/discoverService";

type Props = {
  item: DiscoverItem;
  onApply: () => void;
};

export default function ExpandedCard({ item, onApply }: Props) {
  return (
    <div className="bg-white border-t border-border-light px-5 pb-5 rounded-b-2xl">
      {item.opportunityNotes && (
        <section className="mb-4 pt-4">
          <h4 className="font-semibold text-text-dark text-sm mb-1">Opportunity Notes</h4>
          <p className="text-text-medium text-sm leading-relaxed">{item.opportunityNotes}</p>
        </section>
      )}

      {item.targetAudience && (
        <section className="mb-4">
          <h4 className="font-semibold text-text-dark text-sm mb-1">Target Audience</h4>
          <div className="flex flex-wrap gap-2">
            {item.targetAudience.split(",").map((a) => (
              <span
                key={a}
                className="px-3 py-1 bg-primary-light text-primary text-xs font-medium rounded-full"
              >
                {a.trim()}
              </span>
            ))}
          </div>
        </section>
      )}

      {item.description && (
        <section className="mb-4">
          <h4 className="font-semibold text-text-dark text-sm mb-1">Description</h4>
          <p className="text-text-medium text-sm leading-relaxed">{item.description}</p>
        </section>
      )}

      {(item.onsiteVenue || item.onlineAccess) && (
        <section className="mb-5">
          <h4 className="font-semibold text-text-dark text-sm mb-1">Access Details</h4>
          {item.onsiteVenue && (
            <p className="text-text-medium text-sm">
              <span className="font-medium">Onsite Venue: </span>
              {item.onsiteVenue}
            </p>
          )}
          {item.onlineAccess && (
            <p className="text-text-medium text-sm">
              <span className="font-medium">Online Access: </span>
              {item.onlineAccess}
            </p>
          )}
        </section>
      )}

      <button
        onClick={onApply}
        className="bg-primary text-white font-semibold px-8 py-2.5 rounded-full hover:bg-orange-600 transition-colors min-h-[44px]"
      >
        Apply
      </button>
    </div>
  );
}
