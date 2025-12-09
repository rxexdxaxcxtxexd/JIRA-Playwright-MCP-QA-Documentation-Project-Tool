const { test, expect } = require('@playwright/test');

test.describe('BoatLocationCreate - Create Valid Test Boat', () => {
    test('Gather valid dropdown data and create PWTEST boat', async ({ page }) => {
        console.log('\n========================================');
        console.log('GATHERING VALID FORM DATA');
        console.log('========================================\n');

        // Navigate to create page
        await page.goto('https://localhost:6001/BoatLocationSearch/Create');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Helper function to get dropdown options
        async function getDropdownOptions(selector) {
            const dropdown = page.locator(selector);
            if (await dropdown.count() === 0) {
                return [];
            }

            const options = await dropdown.locator('option').allTextContents();
            const values = await dropdown.locator('option').evaluateAll(opts =>
                opts.map(opt => ({ value: opt.value, text: opt.textContent.trim() }))
            );

            return values.filter(v => v.value && v.value !== '' && v.value !== '0');
        }

        // Gather all available dropdown data
        console.log('Gathering dropdown data...\n');

        const fleets = await getDropdownOptions('select[name="FleetId"]');
        console.log(`Fleets available: ${fleets.length}`);
        if (fleets.length > 0) {
            console.log(`  First fleet: ${fleets[0].text} (${fleets[0].value})`);
        }

        const owners = await getDropdownOptions('select[name="OwnerId"]');
        console.log(`Owners available: ${owners.length}`);
        if (owners.length > 0) {
            console.log(`  First owner: ${owners[0].text} (${owners[0].value})`);
        }

        const operators = await getDropdownOptions('select[name="OperatorId"]');
        console.log(`Operators available: ${operators.length}`);
        if (operators.length > 0) {
            console.log(`  First operator: ${operators[0].text} (${operators[0].value})`);
        }

        const vendors = await getDropdownOptions('select[name="VendorId"]');
        console.log(`Vendors available: ${vendors.length}`);
        if (vendors.length > 0) {
            console.log(`  First vendor: ${vendors[0].text} (${vendors[0].value})`);
        }

        const portFacilities = await getDropdownOptions('select[name="PortFacilityId"]');
        console.log(`Port Facilities available: ${portFacilities.length}`);
        if (portFacilities.length > 0) {
            console.log(`  First port facility: ${portFacilities[0].text} (${portFacilities[0].value})`);
        }

        const boatRoles = await getDropdownOptions('select[name="BoatRoleId"]');
        console.log(`Boat Roles available: ${boatRoles.length}`);
        if (boatRoles.length > 0) {
            console.log(`  First boat role: ${boatRoles[0].text} (${boatRoles[0].value})`);
        }

        const wheelhouseRotations = await getDropdownOptions('select[name="WheelhouseRotationId"]');
        console.log(`Wheelhouse Rotations available: ${wheelhouseRotations.length}`);

        const deckRotations = await getDropdownOptions('select[name="DeckRotationId"]');
        console.log(`Deck Rotations available: ${deckRotations.length}`);

        const crewCoordinators = await getDropdownOptions('select[name="CrewCoordinatorId"]');
        console.log(`Crew Coordinators available: ${crewCoordinators.length}`);

        const portCaptains = await getDropdownOptions('select[name="PortCaptainId"]');
        console.log(`Port Captains available: ${portCaptains.length}`);

        const rivers = await getDropdownOptions('select[name="River"]');
        console.log(`Rivers available: ${rivers.length}`);

        const directions = await getDropdownOptions('select[name="Direction"]');
        console.log(`Directions available: ${directions.length}`);

        const engineTiers = await getDropdownOptions('select[name="EngineTier"]');
        console.log(`Engine Tiers available: ${engineTiers.length}`);

        console.log('\n========================================');
        console.log('CREATING VALID PWTEST BOAT');
        console.log('========================================\n');

        const timestamp = Date.now();
        const validData = {
            // Basic Information (Required fields marked from test scenario 1)
            BoatName: `PWTEST Valid Boat ${timestamp}`,
            ShortName: `PVBT${timestamp.toString().slice(-6)}`,
            UscgNum: `TEST${timestamp.toString().slice(-6)}`,
            CallSign: `PVBT${timestamp.toString().slice(-4)}`,
            MMSI: '123456789', // Exactly 9 digits

            // Contact Information (Required)
            ContactName: 'PWTEST Contact',
            ContactPhone: '5551234567', // 10 digits
            ContactEmail: 'pwtest@example.com',

            // GL Account and Note (Required)
            GlAccountNum: 'PWTEST-GL-001',
            Note: 'Playwright test boat - safe to delete',

            // Physical/Engine (Required)
            CurrentYearBuilt: '2020', // Exactly 4 digits
            EngineMake: 'PWTEST',
            EngineModel: 'TEST-MODEL',

            // Optional but recommended
            Horsepower: 2500,
            ExternalLength: 120,
            ExternalWidth: 35,

            // Dropdowns - will select first available
            FleetId: fleets.length > 0 ? fleets[0].value : null,
            OwnerId: owners.length > 0 ? owners[0].value : null,
            OperatorId: operators.length > 0 ? operators[0].value : null,
            BoatRoleId: boatRoles.length > 0 ? boatRoles[0].value : null,

            // Checkboxes
            IsFleetBoat: fleets.length > 0, // Only if fleet available
            TrackPositionInAis: false, // Set to false to avoid MMSI requirement complexity
            IsActive: true
        };

        console.log('Test data prepared:');
        console.log(JSON.stringify(validData, null, 2));
        console.log('\nFilling out form...\n');

        // Fill Basic Information
        await page.locator('input[name="BoatName"]').fill(validData.BoatName);
        await page.locator('input[name="ShortName"]').fill(validData.ShortName);
        await page.locator('input[name="UscgNum"]').fill(validData.UscgNum);
        await page.locator('input[name="CallSign"]').fill(validData.CallSign);
        await page.locator('input[name="MMSI"]').fill(validData.MMSI);

        // Fill Contact Information
        const contactNameField = page.locator('input[name="ContactName"]');
        if (await contactNameField.count() > 0) {
            await contactNameField.fill(validData.ContactName);
        }

        const contactPhoneField = page.locator('input[name="ContactPhone"]');
        if (await contactPhoneField.count() > 0) {
            await contactPhoneField.fill(validData.ContactPhone);
        }

        const contactEmailField = page.locator('input[name="ContactEmail"]');
        if (await contactEmailField.count() > 0) {
            await contactEmailField.fill(validData.ContactEmail);
        }

        // Fill GL Account
        const glAccountField = page.locator('input[name="GlAccountNum"]');
        if (await glAccountField.count() > 0) {
            await glAccountField.fill(validData.GlAccountNum);
        }

        // Fill Note
        const noteField = page.locator('textarea[name="Note"], input[name="Note"]');
        if (await noteField.count() > 0) {
            await noteField.fill(validData.Note);
        }

        // Fill Physical/Engine Information
        const yearBuiltField = page.locator('input[name="CurrentYearBuilt"]');
        if (await yearBuiltField.count() > 0) {
            await yearBuiltField.fill(validData.CurrentYearBuilt);
        }

        const engineMakeField = page.locator('input[name="EngineMake"]');
        if (await engineMakeField.count() > 0) {
            await engineMakeField.fill(validData.EngineMake);
        }

        const engineModelField = page.locator('input[name="EngineModel"]');
        if (await engineModelField.count() > 0) {
            await engineModelField.fill(validData.EngineModel);
        }

        const horsepowerField = page.locator('input[name="Horsepower"]');
        if (await horsepowerField.count() > 0) {
            await horsepowerField.fill(validData.Horsepower.toString());
        }

        const lengthField = page.locator('input[name="ExternalLength"]');
        if (await lengthField.count() > 0) {
            await lengthField.fill(validData.ExternalLength.toString());
        }

        const widthField = page.locator('input[name="ExternalWidth"]');
        if (await widthField.count() > 0) {
            await widthField.fill(validData.ExternalWidth.toString());
        }

        // Select dropdown values
        if (validData.OwnerId) {
            const ownerDropdown = page.locator('select[name="OwnerId"]');
            if (await ownerDropdown.count() > 0) {
                await ownerDropdown.selectOption(validData.OwnerId);
                console.log(`Selected Owner: ${owners[0].text}`);
            }
        }

        if (validData.OperatorId) {
            const operatorDropdown = page.locator('select[name="OperatorId"]');
            if (await operatorDropdown.count() > 0) {
                await operatorDropdown.selectOption(validData.OperatorId);
                console.log(`Selected Operator: ${operators[0].text}`);
            }
        }

        if (validData.BoatRoleId) {
            const roleDropdown = page.locator('select[name="BoatRoleId"]');
            if (await roleDropdown.count() > 0) {
                await roleDropdown.selectOption(validData.BoatRoleId);
                console.log(`Selected Boat Role: ${boatRoles[0].text}`);
            }
        }

        // Handle Fleet Boat checkbox and dropdown
        if (validData.IsFleetBoat && validData.FleetId) {
            const fleetCheckbox = page.locator('input[id="chkIsFleet"]');
            if (await fleetCheckbox.count() > 0) {
                await fleetCheckbox.check();
                console.log('Checked "Is Fleet Boat"');

                await page.waitForTimeout(500); // Wait for conditional logic

                const fleetDropdown = page.locator('select[name="FleetId"]');
                if (await fleetDropdown.count() > 0 && !await fleetDropdown.isDisabled()) {
                    await fleetDropdown.selectOption(validData.FleetId);
                    console.log(`Selected Fleet: ${fleets[0].text}`);
                }
            }
        }

        await page.waitForTimeout(1000);

        console.log('\nForm filled. Taking screenshot...');
        await page.screenshot({ path: 'test-results/valid-boat-before-submit.png', fullPage: true });

        // Set up network listener to capture POST request
        let postRequestMade = false;
        let postResponse = null;

        page.on('response', async response => {
            if (response.url().includes('/Save') && response.request().method() === 'POST') {
                postRequestMade = true;
                postResponse = {
                    url: response.url(),
                    status: response.status(),
                    statusText: response.statusText()
                };
                console.log(`\n📡 POST Request detected:`);
                console.log(`   URL: ${postResponse.url}`);
                console.log(`   Status: ${postResponse.status} ${postResponse.statusText}`);
            }
        });

        console.log('Checking form validity before submit...');
        const formValid = await page.evaluate(() => {
            const form = document.querySelector('form');
            if (!form) return { error: 'Form not found' };

            // Check HTML5 validation
            const isValidHTML5 = form.checkValidity();

            // Check jQuery validation if available
            let isValidJQuery = true;
            let jqueryErrors = [];
            if (window.jQuery && jQuery(form).data('validator')) {
                const validator = jQuery(form).data('validator');
                isValidJQuery = jQuery(form).valid();
                if (validator.invalid) {
                    jqueryErrors = Object.keys(validator.invalid).map(key => ({
                        field: key,
                        message: validator.invalid[key]
                    }));
                }
            }

            return {
                html5Valid: isValidHTML5,
                jqueryValid: isValidJQuery,
                jqueryErrors: jqueryErrors,
                overallValid: isValidHTML5 && isValidJQuery
            };
        });

        console.log('\nForm Validity Check:');
        console.log(JSON.stringify(formValid, null, 2));

        if (!formValid.overallValid) {
            console.log('\n⚠️  Form has validation errors - attempting to find them:');
            if (formValid.jqueryErrors && formValid.jqueryErrors.length > 0) {
                console.log('jQuery Validation Errors:');
                formValid.jqueryErrors.forEach(err => {
                    console.log(`  - ${err.field}: ${JSON.stringify(err.message)}`);
                });
            }
        }

        console.log('\nSubmitting form via button click...\n');

        // First scroll the submit button into view
        const submitButton = page.locator('form button[type="submit"].btn-primary');
        await submitButton.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);

        // Set up network listener before clicking
        const responsePromise = page.waitForResponse(response => {
            return response.url().includes('BoatLocationSearch') &&
                   (response.request().method() === 'POST' || response.url().includes('Index'));
        }, { timeout: 30000 }).catch(e => {
            console.log('Response wait failed:', e.message);
            return null;
        });

        // Click the button - don't use force so event handlers work properly
        console.log('Clicking submit button...');
        await submitButton.click();

        // Wait for response
        const response = await responsePromise;
        if (response) {
            postRequestMade = true;
            console.log('Response received:', response.url(), response.status());
        }

        // Wait a bit for any client-side processing
        await page.waitForTimeout(3000);

        // Check detailed jQuery validation state after submit attempt
        const detailedValidation = await page.evaluate(() => {
            const form = document.querySelector('form');
            if (!form || !window.jQuery) return { error: 'Form or jQuery not found' };

            const $form = jQuery(form);
            const validator = $form.data('validator');

            if (!validator) return { error: 'Validator not found' };

            // Check validation state
            const isValid = $form.valid();

            // Get all invalid fields
            const invalidFields = [];
            if (validator.errorList) {
                validator.errorList.forEach(err => {
                    invalidFields.push({
                        element: err.element.name || err.element.id,
                        message: err.message
                    });
                });
            }

            // Also check invalid object
            const invalidFromMap = Object.keys(validator.invalid || {}).map(key => ({
                field: key,
                isInvalid: true
            }));

            return {
                isValid: isValid,
                errorList: invalidFields,
                invalidMap: invalidFromMap,
                numberOfInvalids: validator.numberOfInvalids()
            };
        });

        console.log('\nDetailed jQuery Validation after submit:');
        console.log(JSON.stringify(detailedValidation, null, 2));

        // Check current URL
        const currentUrl = page.url();
        console.log('Current URL after submit:', currentUrl);

        if (currentUrl.includes('/Index') || currentUrl.includes('/Edit/')) {
            postRequestMade = true;
            console.log('Navigation to Index or Edit detected');
        }

        console.log(`\n📮 Form POST made: ${postRequestMade ? 'YES' : 'NO'}`);
        if (!postRequestMade) {
            console.log('⚠️  Form did NOT submit - likely client-side validation preventing submit');
        }

        // Scroll to top to see any validation errors
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(500);

        // Take a full page screenshot to capture any validation errors at top
        await page.screenshot({ path: 'test-results/valid-boat-after-submit-top.png', fullPage: true });

        // Check for validation errors
        const validationSummary = page.locator('.validation-summary-errors, .alert-danger');
        const hasValidationErrors = await validationSummary.count() > 0;

        if (hasValidationErrors) {
            const errors = await validationSummary.locator('li').allTextContents();
            console.log('❌ VALIDATION ERRORS FOUND:');
            errors.forEach(err => console.log(`  - ${err}`));

            const fieldErrors = await page.locator('.field-validation-error, .text-danger').allTextContents();
            if (fieldErrors.length > 0) {
                console.log('\nFIELD-LEVEL ERRORS:');
                fieldErrors.filter(e => e.trim()).forEach(err => console.log(`  - ${err}`));
            }

            await page.screenshot({ path: 'test-results/valid-boat-validation-errors.png', fullPage: true });
        } else {
            console.log('✅ No client-side validation errors detected');

            // Check for any field-level errors that might not be in summary
            const allFieldErrors = await page.locator('.field-validation-error, span.text-danger').allTextContents();
            const nonEmptyFieldErrors = allFieldErrors.filter(e => e.trim());
            if (nonEmptyFieldErrors.length > 0) {
                console.log('⚠️  FIELD-LEVEL VALIDATION MESSAGES FOUND:');
                nonEmptyFieldErrors.forEach(err => console.log(`  - ${err}`));
            }
        }

        // Check for success
        const successAlert = page.locator('.alert-success');
        const hasSuccessMessage = await successAlert.count() > 0;

        const redirectedToIndex = page.url().includes('/Index');
        const stayedOnCreate = page.url().includes('/Create');

        console.log('\n========================================');
        console.log('SUBMISSION RESULT');
        console.log('========================================');
        console.log(`Validation Errors: ${hasValidationErrors ? 'YES' : 'NO'}`);
        console.log(`Success Message: ${hasSuccessMessage ? 'YES' : 'NO'}`);
        console.log(`Redirected to Index: ${redirectedToIndex ? 'YES' : 'NO'}`);
        console.log(`Stayed on Create: ${stayedOnCreate ? 'YES' : 'NO'}`);
        console.log(`Current URL: ${page.url()}`);

        if (hasSuccessMessage) {
            const successText = await successAlert.textContent();
            console.log(`Success Message: ${successText}`);
        }

        await page.screenshot({ path: 'test-results/valid-boat-after-submit.png', fullPage: true });

        if (redirectedToIndex || hasSuccessMessage) {
            console.log('\n✅ BOAT CREATED SUCCESSFULLY!');
            console.log(`Boat Name: ${validData.BoatName}`);
            console.log(`Short Name: ${validData.ShortName}`);
            console.log(`USCG#: ${validData.UscgNum}`);
        } else if (hasValidationErrors) {
            console.log('\n❌ BOAT CREATION FAILED - Validation errors above');
        } else {
            console.log('\n⚠️  BOAT CREATION STATUS UNCLEAR - Check screenshots');
        }
        console.log('========================================\n');

        // If successful, search for the created boat
        if (redirectedToIndex || hasSuccessMessage) {
            console.log('Searching for created boat in list...');

            if (!page.url().includes('/Index')) {
                await page.goto('https://localhost:6001/BoatLocationSearch/Index');
                await page.waitForLoadState('networkidle');
            }

            await page.waitForTimeout(2000);

            // Search for the boat by name
            const searchNameField = page.locator('input[name="BoatName"]');
            if (await searchNameField.count() > 0) {
                await searchNameField.fill(validData.BoatName);
                const searchButton = page.locator('#btnSearch');
                await searchButton.click();
                await page.waitForTimeout(3000);

                await page.screenshot({ path: 'test-results/valid-boat-search-result.png', fullPage: true });

                const tableRows = await page.locator('#boatLocationTable tbody tr').count();
                console.log(`Search results: ${tableRows} row(s) found`);

                if (tableRows > 0) {
                    const firstRow = await page.locator('#boatLocationTable tbody tr').first().textContent();
                    if (firstRow.includes(validData.ShortName)) {
                        console.log('✅ VERIFIED: Boat appears in search results!');
                    }
                }
            }
        }

        // Assert test passed if boat was created
        expect(redirectedToIndex || hasSuccessMessage).toBeTruthy();
    });
});
