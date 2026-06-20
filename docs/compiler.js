const fs = require('fs');
const htmlPdf = require('html-pdf-node');

/**
 * FORGE B2B - Dynamic PDF Proposal Compiler
 * Reads the directory JSON data, updates forge-strategy-pack.html variables, and exports a flat PDF.
 */
async function compilePdfProposal(jsonFilePath, htmlTemplatePath) {
    try {
        console.log(`[FORGE INTEL] Reading data layer from: ${jsonFilePath}...`);
        
        // 1. Load data payload
        const rawData = fs.readFileSync(jsonFilePath);
        const data = JSON.parse(rawData);

        const N = data.directory_metadata.total_database_listings;
        const platformName = data.directory_metadata.platform_name;
        const slug = data.directory_metadata.target_slug;

        // 2. Execute financial simulation mathematics
        const act10 = Math.round(N * 0.10);
        const act20 = Math.round(N * 0.20);

        // Calculate currency strings formatted for presentation (£)
        const formatCurrency = (val) => '£' + Math.round(val).toLocaleString('en-GB');

        const metrics = {
            '{{Database Size (N)}}': N.toLocaleString('en-GB'),
            '{{Database Size}}': N.toLocaleString('en-GB'),
            '{{10% of N Users}}': act10.toLocaleString('en-GB') + ' businesses',
            '{{20% of N Users}}': act20.toLocaleString('en-GB') + ' businesses',
            '{{Directory Platform Name}}': platformName,
            
            // Tier 1 Simulation Mappings (40% Partner share of £49 = £19.60)
            '{{T1_10_MRR}}': formatCurrency(act10 * 19.60) + '/mo',
            '{{T1_10_Y1}}': formatCurrency((act10 * 19.60 * 12) - 1499.99),
            '{{T1_20_MRR}}': formatCurrency(act20 * 19.60) + '/mo',
            '{{T1_20_Y1}}': formatCurrency((act20 * 19.60 * 12) - 1499.99),

            // Tier 2 Simulation Mappings (Partner clears £24.30 profit)
            '{{T2_10_MRR}}': formatCurrency(act10 * 24.30) + '/mo',
            '{{T2_10_Y1}}': formatCurrency((act10 * 24.30 * 12) - 4499.99),
            '{{T2_20_MRR}}': formatCurrency(act20 * 24.30) + '/mo',
            '{{T2_20_Y1}}': formatCurrency((act20 * 24.30 * 12) - 4499.99),

            // Tier 3 Simulation Mappings (Partner clears £34.00 profit)
            '{{T3_10_MRR}}': formatCurrency(act10 * 34.00) + '/mo',
            '{{T3_10_Y1}}': formatCurrency((act10 * 34.00 * 12) - 8499.99),
            '{{T3_20_MRR}}': formatCurrency(act20 * 34.00) + '/mo',
            '{{T3_20_Y1}}': formatCurrency((act20 * 34.00 * 12) - 8499.99),
        };

        // Assign recommended tier badge name and commercial parameters dynamically
        if (N < 1000) {
            metrics['{{Recommended Tier}}'] = 'Tier 1: The Engine (Revenue Share max)';
            metrics['{{Selected_Tier_Name}}'] = 'Tier 1: The Engine';
            metrics['{{Selected_Setup_Price}}'] = '£1,499.99';
            metrics['{{Tier Net Year 1 Profit}}'] = formatCurrency((act10 * 19.60 * 12) - 1499.99);
        } else if (N <= 5000) {
            metrics['{{Recommended Tier}}'] = 'Tier 2: The Hybrid Model';
            metrics['{{Selected_Tier_Name}}'] = 'Tier 2: The Hybrid';
            metrics['{{Selected_Setup_Price}}'] = '£4,499.99';
            metrics['{{Tier Net Year 1 Profit}}'] = formatCurrency((act10 * 24.30 * 12) - 4499.99);
        } else {
            metrics['{{Recommended Tier}}'] = 'Tier 3: The Embedded Stack';
            metrics['{{Selected_Tier_Name}}'] = 'Tier 3: The Embedded Stack';
            metrics['{{Selected_Setup_Price}}'] = '£8,499.99';
            metrics['{{Tier Net Year 1 Profit}}'] = formatCurrency((act10 * 34.00 * 12) - 8499.99);
        }

        // 3. Ingest HTML Template and run find-and-replace pipeline
        let htmlContent = fs.readFileSync(htmlTemplatePath, 'utf8');
        
        console.log(`[FORGE AGENT] Populating dynamic brackets with simulation results...`);
        for (const [key, value] of Object.entries(metrics)) {
            htmlContent = htmlContent.split(key).join(value);
        }

        // 4. Render to static PDF binary file asset
        console.log(`[FORGE ENGINE] Generating flat PDF document layout...`);
        const options = { 
            format: 'A4', 
            margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
            printBackground: true 
        };
        const file = { content: htmlContent };

        htmlPdf.generatePdf(file, options).then(pdfBuffer => {
            const outputPath = `./proposal-${slug}.pdf`;
            fs.writeFileSync(outputPath, pdfBuffer);
            console.log(`\n================================================================`);
            console.log(`[FORGE SUCCESS] Flat B2B Proposal Document compiled cleanly!`);
            console.log(`[ASSET DESTINATION] -> ${outputPath}`);
            console.log(`================================================================\n`);
        });

    } catch (error) {
        console.error(`[FORGE ERROR] Compilation engine dropped frame:`, error.message);
    }
}

// Execution Blueprint Call
// Replace the first parameter with the actual JSON file name generated in your Option A run!
compilePdfProposal('./ingestion-target-directory.json', './forge-strategy-pack.html');