// ... existing code ...
        // Stage 2: Scrape details for each listing URL
        const BATCH_SIZE = 5;
        const REQUEST_DELAY = 2000; // 2-second delay between requests

        for (let i = 0; i < allListingUrls.length; i += BATCH_SIZE) {
            const batchUrls = allListingUrls.slice(i, i + BATCH_SIZE);
            this.log('INFO', `Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(allListingUrls.length / BATCH_SIZE)}...`);

            const batchPromises = batchUrls.map(async (listingInfo) => {
                try {
                    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
                    
                    this.log('INFO', 'Scraping listing details', { url: listingInfo.url });
                    const details = await this.scrapeListingDetails(listingInfo);

                    if (details) {
// ... existing code ...
