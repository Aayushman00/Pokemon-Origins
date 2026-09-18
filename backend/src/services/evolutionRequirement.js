const { slugToTitleCase } = require("../utils/formatSlug");

function formatEvolutionRequirement(details) {
  if (!details) return null;
  const trigger = details.trigger?.name;

  if (trigger === "level-up") {
    if (details.min_level != null) return `Lv. ${details.min_level}`;
    if (details.min_happiness != null) return "Friendship";
    if (details.min_beauty != null) return "Beauty";
    if (details.known_move_type) return `Knows ${slugToTitleCase(details.known_move_type.name)} move`;
    return "Level Up";
  }

  if (trigger === "use-item") {
    return details.item ? slugToTitleCase(details.item.name) : "Use Item";
  }

  if (trigger === "trade") return "Trade";

  return trigger ? slugToTitleCase(trigger) : null;
}

module.exports = { formatEvolutionRequirement };
