class CampaignError extends Error {
	constructor(status, message) {
		super(message);
		this.status = status;
		this.name = "CampaignError";
	}
}

module.exports = { CampaignError };
