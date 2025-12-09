const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('BoatLocationSearch - Data Comparison Between Search and Edit', () => {
    let comparisonReport = {
        testSuite: 'BoatLocationSearch Data Comparison',
        timestamp: new Date().toISOString(),
        searchURL: 'https://localhost:6001/BoatLocationSearch/Index',
        editURL: 'https://localhost:6001/BoatLocationSearch/Edit/3129',
        locationId: 3129,
        fieldComparisons: [],
        summary: {
            totalFields: 0,
            matchingFields: 0,
            mismatchedFields: 0,
            searchOnlyFields: 0,
            editOnlyFields: 0
        }
    };

    test('Extract and Compare Field Data', async ({ page }) => {
        // ============================================
        // STEP 1: Navigate to Search Page and Get Data
        // ============================================
        console.log('\n========================================');
        console.log('STEP 1: Navigating to Search Page');
        console.log('========================================');

        await page.goto('https://localhost:6001/BoatLocationSearch/Index');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Search for the specific boat by clicking Find to load results
        const findButton = page.locator('#btnSearch');
        await findButton.click();
        await page.waitForTimeout(3000);

        // Wait for DataTable to load
        await page.waitForSelector('#boatLocationTable tbody tr', { timeout: 10000 });

        // Find the row with LocationId 3129 and click it
        const targetRow = page.locator(`#boatLocationTable tbody tr a[href*="/BoatLocationSearch/Edit/3129"]`).first();

        // Extract data from the search results table row
        const searchData = await page.evaluate(() => {
            const row = document.querySelector('a[href*="/BoatLocationSearch/Edit/3129"]')?.closest('tr');
            if (!row) return null;

            const cells = row.querySelectorAll('td');
            const data = {
                _rowHTML: row.innerHTML,
                _cellCount: cells.length,
                cells: Array.from(cells).map((cell, index) => ({
                    index: index,
                    text: cell.textContent?.trim() || '',
                    innerHTML: cell.innerHTML
                }))
            };

            return data;
        });

        console.log('Search Results Row Data:');
        console.log(JSON.stringify(searchData, null, 2));

        // Take screenshot of search results
        await page.screenshot({
            path: path.join(__dirname, '..', 'test-results', 'comparison-search-results.png'),
            fullPage: true
        });

        // ============================================
        // STEP 2: Navigate to Edit Page and Get Data
        // ============================================
        console.log('\n========================================');
        console.log('STEP 2: Navigating to Edit Page');
        console.log('========================================');

        await page.goto('https://localhost:6001/BoatLocationSearch/Edit/3129');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Extract all form field values from the edit page
        const editData = await page.evaluate(() => {
            const form = document.getElementById('boatLocationEditForm');
            if (!form) return { error: 'Form not found' };

            const data = {
                basicInformation: {},
                ownershipContact: {},
                physical: {},
                fleetOnboard: {},
                boatPosition: {},
                readonlyFields: {},
                allFields: {}
            };

            // Helper function to get field value
            function getFieldValue(element) {
                if (!element) return null;

                if (element.type === 'checkbox') {
                    return element.checked;
                } else if (element.type === 'select-one') {
                    const selectedOption = element.options[element.selectedIndex];
                    return {
                        value: element.value,
                        text: selectedOption ? selectedOption.text : ''
                    };
                } else if (element.type === 'select-multiple') {
                    return Array.from(element.selectedOptions).map(opt => ({
                        value: opt.value,
                        text: opt.text
                    }));
                } else {
                    return element.value;
                }
            }

            // Basic Information
            data.basicInformation.BoatName = getFieldValue(form.querySelector('[name="BoatName"]'));
            data.basicInformation.ShortName = getFieldValue(form.querySelector('[name="ShortName"]'));
            data.basicInformation.UscgNum = getFieldValue(form.querySelector('[name="UscgNum"]'));
            data.basicInformation.CallSign = getFieldValue(form.querySelector('[name="CallSign"]'));
            data.basicInformation.MMSI = getFieldValue(form.querySelector('[name="MMSI"]'));
            data.basicInformation.TrackPositionInAis = getFieldValue(form.querySelector('[name="TrackPositionInAis"]'));
            data.basicInformation.IsAssistTug = getFieldValue(form.querySelector('[name="IsAssistTug"]'));

            // Ownership and Contact
            data.ownershipContact.OwnerId = getFieldValue(form.querySelector('[name="OwnerId"]'));
            data.ownershipContact.OperatorId = getFieldValue(form.querySelector('[name="OperatorId"]'));
            data.ownershipContact.ContactName = getFieldValue(form.querySelector('[name="ContactName"]'));
            data.ownershipContact.ContactPhone = getFieldValue(form.querySelector('[name="ContactPhone"]'));
            data.ownershipContact.ContactEmail = getFieldValue(form.querySelector('[name="ContactEmail"]'));
            data.ownershipContact.GlAccountNum = getFieldValue(form.querySelector('[name="GlAccountNum"]'));
            data.ownershipContact.Note = getFieldValue(form.querySelector('[name="Note"]'));

            // Physical
            data.physical.ExternalLength = getFieldValue(form.querySelector('[name="ExternalLength"]'));
            data.physical.ExternalWidth = getFieldValue(form.querySelector('[name="ExternalWidth"]'));
            data.physical.MaximumHeight = getFieldValue(form.querySelector('[name="MaximumHeight"]'));
            data.physical.MinimumHeight = getFieldValue(form.querySelector('[name="MinimumHeight"]'));
            data.physical.LoadDraft = getFieldValue(form.querySelector('[name="LoadDraft"]'));
            data.physical.LightDraft = getFieldValue(form.querySelector('[name="LightDraft"]'));
            data.physical.Horsepower = getFieldValue(form.querySelector('[name="Horsepower"]'));
            data.physical.CurrentYearBuilt = getFieldValue(form.querySelector('[name="CurrentYearBuilt"]'));
            data.physical.EngineMake = getFieldValue(form.querySelector('[name="EngineMake"]'));
            data.physical.EngineModel = getFieldValue(form.querySelector('[name="EngineModel"]'));
            data.physical.EngineTier = getFieldValue(form.querySelector('[name="EngineTier"]'));
            data.physical.MaxFuelLevel = getFieldValue(form.querySelector('[name="MaxFuelLevel"]'));
            data.physical.LowFuelLevel = getFieldValue(form.querySelector('[name="LowFuelLevel"]'));
            data.physical.CriticalFuelLevel = getFieldValue(form.querySelector('[name="CriticalFuelLevel"]'));

            // Fleet and Onboard
            data.fleetOnboard.IsFleetBoat = getFieldValue(form.querySelector('[name="IsFleetBoat"]'));
            data.fleetOnboard.FleetId = getFieldValue(form.querySelector('[name="FleetId"]'));
            data.fleetOnboard.EnableOnboard = getFieldValue(form.querySelector('[name="EnableOnboard"]'));
            data.fleetOnboard.StartOnboardRecovery = getFieldValue(form.querySelector('[name="StartOnboardRecovery"]'));
            data.fleetOnboard.VendorId = getFieldValue(form.querySelector('[name="VendorId"]'));

            // Read-only fields
            const currentStatusField = document.querySelector('input[value*=""][readonly]');
            const divisionField = Array.from(document.querySelectorAll('input[readonly]')).find(el =>
                el.previousElementSibling?.textContent?.includes('Division')
            );
            const portFacilityField = Array.from(document.querySelectorAll('input[readonly]')).find(el =>
                el.previousElementSibling?.textContent?.includes('Port facility')
            );
            const roleField = Array.from(document.querySelectorAll('input[readonly]')).find(el =>
                el.previousElementSibling?.textContent?.includes('Role')
            );

            data.readonlyFields.CurrentStatus = currentStatusField?.value || '';
            data.readonlyFields.Division = divisionField?.value || '';
            data.readonlyFields.PortFacility = portFacilityField?.value || '';
            data.readonlyFields.BoatRole = roleField?.value || '';

            // Boat Position
            data.boatPosition.River = getFieldValue(form.querySelector('[name="River"]'));
            data.boatPosition.Mile = getFieldValue(form.querySelector('[name="Mile"]'));
            data.boatPosition.Direction = getFieldValue(form.querySelector('[name="Direction"]'));
            data.boatPosition.PositionUpdatedDate = getFieldValue(form.querySelector('[name="PositionUpdatedDate"]'));
            data.boatPosition.PositionUpdatedTime = getFieldValue(form.querySelector('[name="PositionUpdatedTime"]'));
            data.boatPosition.EstimatedArrivalDate = getFieldValue(form.querySelector('[name="EstimatedArrivalDate"]'));
            data.boatPosition.EstimatedArrivalTime = getFieldValue(form.querySelector('[name="EstimatedArrivalTime"]'));
            data.boatPosition.ShowPositionOnPortal = getFieldValue(form.querySelector('[name="ShowPositionOnPortal"]'));

            // Flatten all fields into a single object
            data.allFields = {
                ...data.basicInformation,
                ...data.ownershipContact,
                ...data.physical,
                ...data.fleetOnboard,
                ...data.boatPosition,
                ...data.readonlyFields
            };

            return data;
        });

        console.log('Edit Page Data:');
        console.log(JSON.stringify(editData, null, 2));

        // Take screenshot of edit page
        await page.screenshot({
            path: path.join(__dirname, '..', 'test-results', 'comparison-edit-page.png'),
            fullPage: true
        });

        // ============================================
        // STEP 3: Compare Data and Generate Report
        // ============================================
        console.log('\n========================================');
        console.log('STEP 3: Comparing Data');
        console.log('========================================');

        // Map search result columns to edit form fields
        // Based on typical DataTable structure for boat locations
        const fieldMappings = [
            { searchColumn: 'Boat Name', editField: 'BoatName', category: 'Basic Information' },
            { searchColumn: 'Short Name', editField: 'ShortName', category: 'Basic Information' },
            { searchColumn: 'USCG #', editField: 'UscgNum', category: 'Basic Information' },
            { searchColumn: 'Owner', editField: 'OwnerId', category: 'Ownership', isSelect: true },
            { searchColumn: 'Operator', editField: 'OperatorId', category: 'Ownership', isSelect: true },
            { searchColumn: 'Current Status', editField: 'CurrentStatus', category: 'Fleet/Onboard', readonly: true },
            { searchColumn: 'Division', editField: 'Division', category: 'Fleet/Onboard', readonly: true },
            { searchColumn: 'Role', editField: 'BoatRole', category: 'Fleet/Onboard', readonly: true }
        ];

        // Store all edit fields for reporting
        comparisonReport.editPageFields = editData;
        comparisonReport.searchPageData = searchData;

        // Perform field-by-field comparison
        const comparisons = [];

        for (const [fieldName, fieldValue] of Object.entries(editData.allFields)) {
            const comparison = {
                fieldName: fieldName,
                editValue: fieldValue,
                category: getFieldCategory(fieldName),
                type: getFieldType(fieldValue),
                notes: []
            };

            // Add to comparisons
            comparisons.push(comparison);
        }

        function getFieldCategory(fieldName) {
            if (['BoatName', 'ShortName', 'UscgNum', 'CallSign', 'MMSI', 'TrackPositionInAis', 'IsAssistTug'].includes(fieldName)) {
                return 'Basic Information';
            } else if (['OwnerId', 'OperatorId', 'ContactName', 'ContactPhone', 'ContactEmail', 'GlAccountNum', 'Note'].includes(fieldName)) {
                return 'Ownership and Contact';
            } else if (['ExternalLength', 'ExternalWidth', 'MaximumHeight', 'MinimumHeight', 'LoadDraft', 'LightDraft',
                        'Horsepower', 'CurrentYearBuilt', 'EngineMake', 'EngineModel', 'EngineTier',
                        'MaxFuelLevel', 'LowFuelLevel', 'CriticalFuelLevel'].includes(fieldName)) {
                return 'Physical';
            } else if (['IsFleetBoat', 'FleetId', 'EnableOnboard', 'StartOnboardRecovery', 'VendorId',
                        'CurrentStatus', 'Division', 'PortFacility', 'BoatRole'].includes(fieldName)) {
                return 'Fleet and Onboard';
            } else if (['River', 'Mile', 'Direction', 'PositionUpdatedDate', 'PositionUpdatedTime',
                        'EstimatedArrivalDate', 'EstimatedArrivalTime', 'ShowPositionOnPortal'].includes(fieldName)) {
                return 'Boat Position';
            }
            return 'Other';
        }

        function getFieldType(value) {
            if (typeof value === 'boolean') return 'checkbox';
            if (value && typeof value === 'object' && 'value' in value) return 'select';
            if (typeof value === 'string') return 'text';
            if (typeof value === 'number') return 'number';
            return 'unknown';
        }

        comparisonReport.fieldComparisons = comparisons;
        comparisonReport.summary.totalFields = comparisons.length;

        console.log('\n========================================');
        console.log('COMPARISON SUMMARY');
        console.log('========================================');
        console.log(`Total Edit Fields: ${comparisonReport.summary.totalFields}`);
        console.log('========================================\n');
    });

    test.afterAll(async () => {
        const reportPath = path.join(__dirname, '..', '.claude', 'data-comparison-report.md');

        let markdown = `# BoatLocationSearch - Data Comparison Report\n\n`;
        markdown += `**Generated:** ${comparisonReport.timestamp}\n`;
        markdown += `**Search URL:** ${comparisonReport.searchURL}\n`;
        markdown += `**Edit URL:** ${comparisonReport.editURL}\n`;
        markdown += `**Location ID:** ${comparisonReport.locationId}\n\n`;
        markdown += `---\n\n`;

        markdown += `## Summary\n\n`;
        markdown += `- **Total Fields in Edit Form:** ${comparisonReport.summary.totalFields}\n\n`;

        markdown += `---\n\n`;

        markdown += `## Search Results Data\n\n`;
        if (comparisonReport.searchPageData) {
            markdown += `### DataTable Row for Location ${comparisonReport.locationId}\n\n`;
            markdown += `**Cell Count:** ${comparisonReport.searchPageData._cellCount}\n\n`;
            markdown += `| Cell Index | Content |\n`;
            markdown += `|------------|----------|\n`;
            comparisonReport.searchPageData.cells.forEach(cell => {
                markdown += `| ${cell.index} | ${cell.text.replace(/\|/g, '\\|').replace(/\n/g, ' ')} |\n`;
            });
            markdown += `\n`;
        }

        markdown += `---\n\n`;

        markdown += `## Edit Form Fields by Category\n\n`;

        const categories = ['Basic Information', 'Ownership and Contact', 'Physical', 'Fleet and Onboard', 'Boat Position', 'Other'];

        for (const category of categories) {
            const categoryFields = comparisonReport.fieldComparisons.filter(f => f.category === category);
            if (categoryFields.length === 0) continue;

            markdown += `### ${category}\n\n`;
            markdown += `| Field Name | Type | Current Value | Notes |\n`;
            markdown += `|------------|------|---------------|-------|\n`;

            categoryFields.forEach(field => {
                let displayValue = '';
                if (field.type === 'select' && field.editValue) {
                    displayValue = `${field.editValue.text} (${field.editValue.value})`;
                } else if (field.type === 'checkbox') {
                    displayValue = field.editValue ? 'Yes' : 'No';
                } else {
                    displayValue = field.editValue || '(empty)';
                }

                const notes = field.notes.length > 0 ? field.notes.join('; ') : '-';
                markdown += `| ${field.fieldName} | ${field.type} | ${displayValue} | ${notes} |\n`;
            });
            markdown += `\n`;
        }

        markdown += `---\n\n`;

        markdown += `## Raw Data\n\n`;
        markdown += `### Edit Page - All Fields\n\`\`\`json\n${JSON.stringify(comparisonReport.editPageFields, null, 2)}\n\`\`\`\n\n`;

        if (comparisonReport.searchPageData) {
            markdown += `### Search Results - Row Data\n\`\`\`json\n${JSON.stringify(comparisonReport.searchPageData, null, 2)}\n\`\`\`\n\n`;
        }

        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, markdown);

        console.log('\n========================================');
        console.log('COMPARISON REPORT GENERATED');
        console.log('========================================');
        console.log(`Report saved to: ${reportPath}`);
        console.log(`Total fields analyzed: ${comparisonReport.summary.totalFields}`);
        console.log('========================================\n');
    });
});
