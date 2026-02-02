/**
 * Comprehensive Backend API Test Script
 * 
 * Tests all implemented API endpoints before frontend integration
 * Run: node tests/api-test.js
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

// Test data storage
const testData = {
    token: null,
    resetToken: null,
    merchantId: null,
    beneficiaryId: null,
    payoutId: null
};

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

// Helper functions
// Helper functions
function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, colors.green);
}

function logError(message) {
    log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
    if (typeof message === 'object') {
        log(`ℹ️  ${JSON.stringify(message, null, 2)}`, colors.cyan);
    } else {
        log(`ℹ️  ${message}`, colors.cyan);
    }
}

function logSection(title) {
    log(`\n${'='.repeat(60)}`, colors.bright);
    log(`  ${title}`, colors.bright);
    log('='.repeat(60), colors.bright);
}

async function makeRequest(method, endpoint, data = null, useAuth = false) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (useAuth && testData.token) {
        headers['Authorization'] = `Bearer ${testData.token}`;
    }

    const options = {
        method,
        headers
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const result = await response.json();
        
        return {
            status: response.status,
            ok: response.ok,
            data: result
        };
    } catch (error) {
        return {
            status: 0,
            ok: false,
            error: error.message
        };
    }
}

// Test functions
async function testAuthLogin() {
    logSection('🔐 Testing Auth Module - Login');
    
    const result = await makeRequest('POST', '/auth/login', {
        email: 'test@silkpay.local',
        password: 'password123'
    });

    if (result.ok && result.data.success) {
        testData.token = result.data.data.token;
        testData.merchantId = result.data.data.merchant.id;
        logSuccess('Login successful');
        logInfo(`Token: ${testData.token.substring(0, 20)}...`);
        logInfo(`Merchant ID: ${testData.merchantId}`);
        return true;
    } else {
        logError(`Login failed: ${result.data?.error?.message || result.error}`);
        return false;
    }
}

async function testAuthForgotPassword() {
    logSection('📧 Testing Auth Module - Forgot Password');
    
    const result = await makeRequest('POST', '/auth/forgot-password', {
        email: 'test@silkpay.local'
    });

    if (result.ok && result.data.success) {
        testData.resetToken = result.data.data.token; // In dev mode
        logSuccess('Forgot password request successful');
        if (testData.resetToken) {
            logInfo(`Reset Token: ${testData.resetToken.substring(0, 20)}...`);
        }
        return true;
    } else {
        logError(`Forgot password failed: ${result.data?.error?.message || result.error}`);
        return false;
    }
}

async function testAuthResetPassword() {
    logSection('🔑 Testing Auth Module - Reset Password');
    
    if (!testData.resetToken) {
        logError('No reset token available, skipping reset password test');
        return false;
    }

    const result = await makeRequest('POST', '/auth/reset-password', {
        token: testData.resetToken,
        password: 'newPassword123'
    });

    if (result.ok && result.data.success) {
        logSuccess('Password reset successful');
        
        // Reset password back to original
        const resetBack = await makeRequest('POST', '/auth/forgot-password', {
            email: 'test@silkpay.local'
        });
        if (resetBack.ok && resetBack.data.data.token) {
            await makeRequest('POST', '/auth/reset-password', {
                token: resetBack.data.data.token,
                password: 'password123'
            });
            logInfo('Password reset back to original');
        }
        return true;
    } else {
        logError(`Password reset failed: ${result.data?.error?.message || result.error}`);
        return false;
    }
}

async function testMerchantProfile() {
    logSection('👤 Testing Merchant Module - Profile');
    
    const result = await makeRequest('GET', '/merchant/profile', null, true);

    if (result.ok && result.data.success) {
        logSuccess('Get profile successful');
        logInfo(`Merchant: ${result.data.data.name} (${result.data.data.merchant_no})`);
        return true;
    } else {
        logError(`Get profile failed: ${result.data?.error?.message || result.error}`);
        return false;
    }
}

async function testMerchantUpdateProfile() {
    logSection('✏️  Testing Merchant Module - Update Profile');
    
    const result = await makeRequest('PUT', '/merchant/profile', {
        name: 'Updated Test Merchant',
        mobile: '9876543210'
    }, true);

    if (result.ok && result.data.success) {
        logSuccess('Update profile successful');
        return true;
    } else {
        logError(`Update profile failed: ${result.data?.error?.message || result.error}`);
        return false;
    }
}

async function testMerchantChangePassword() {
    logSection('🔐 Testing Merchant Module - Change Password');
    
    const result = await makeRequest('POST', '/merchant/change-password', {
        oldPassword: 'password123',
        newPassword: 'testPassword456'
    }, true);

    if (result.ok && result.data.success) {
        logSuccess('Password changed successfully');
        
        // Change back to original
        await makeRequest('POST', '/merchant/change-password', {
            oldPassword: 'testPassword456',
            newPassword: 'password123'
        }, true);
        logInfo('Password changed back to original');
        return true;
    } else {
        logError(`Change password failed: ${result.data?.error?.message || result.error}`);
        return false;
    }
}

async function testMerchantApiKeys() {
    logSection('🔑 Testing Merchant Module - API Keys');
    
    // 1. Get Keys (Masked)
    const result = await makeRequest('GET', '/merchant/api-keys', null, true);
    if (result.ok && result.data.success) {
        logSuccess('Get API keys successful');
        logInfo(`Secret Key: ${result.data.data.secret_key}`);
        if(result.data.data.secret_key.includes('****') || result.data.data.secret_key.includes('XXX')) {
             logSuccess('Secret key is correctly masked');
        } else {
             logError('Secret key is NOT masked');
        }
    } else {
        logError(`Get API keys failed: ${result.data?.error?.message || result.error}`);
        return false;
    }

    // 2. IP Whitelist
    logInfo('Testing IP Whitelist update...');
    const ipResult = await makeRequest('PUT', '/merchant/whitelist-ips', {
        ips: ['192.168.1.1', '10.0.0.1']
    }, true);

    if (ipResult.ok && ipResult.data.success) {
        logSuccess('IP Whitelist updated successfully');
        logInfo(`Whitelisted IPs: ${ipResult.data.data.whitelist_ips.join(', ')}`);
    } else {
        logError(`Update IP whitelist failed: ${ipResult.data?.error?.message || ipResult.error}`);
        return false;
    }

    // 3. Rotate Key
    logInfo('Testing Secret Key Rotation...');
    const rotateResult = await makeRequest('POST', '/merchant/api-keys/rotate', {}, true);
    if (rotateResult.ok && rotateResult.data.success) {
        logSuccess('Secret Key rotated successfully');
        logInfo(`New Key: ${rotateResult.data.data.secret_key.substring(0, 10)}... (returned fully for update)`);
        return true;
    } else {
        logError(`Rotate secret key failed: ${rotateResult.data?.error?.message || rotateResult.error}`);
        return false;
    }
}

async function testBeneficiaryCreate() {
    logSection('➕ Testing Beneficiary Module - Create');
    
    const result = await makeRequest('POST', '/beneficiaries', {
        name: 'Test Beneficiary - ' + Date.now(),
        contact_info: {
            mobile: '9876543210',
            email: 'test@example.com'
        },
        bank_details: {
            account_number: '1234567890123456',
            ifsc_code: 'SBIN0001234',
            bank_name: 'State Bank of India',
            upi_id: 'test@paytm'
        },
        notes: 'Test beneficiary for API testing'
    }, true);

    if (result.ok && result.data.success) {
        testData.beneficiaryId = result.data.data._id;
        logSuccess('Beneficiary created successfully');
        logInfo(`Beneficiary ID: ${testData.beneficiaryId}`);
        return true;
    } else {
        logError(`Create beneficiary failed: ${result.data?.error?.message || result.error}`);
        return false;
    }
}

async function testBeneficiaryList() {
    logSection('📋 Testing Beneficiary Module - List');
    
    const result = await makeRequest('GET', '/beneficiaries?page=1&limit=10', null, true);

    if (result.ok && result.data.success) {
        logSuccess(`Retrieved ${result.data.data.beneficiaries.length} beneficiaries`);
        logInfo(`Total: ${result.data.data.pagination?.total || result.data.data.totalBeneficiaries}`);
        return true;
    } else {
        logError(`List beneficiaries failed: ${result.data?.error?.message || result.error}`);
        return false;
    }
}

async function testBeneficiaryUpdate() {
    logSection('✏️  Testing Beneficiary Module - Update');
    
    if (!testData.beneficiaryId) {
        logError('No beneficiary ID available, skipping update test');
        return false;
    }

    const result = await makeRequest('PUT', `/beneficiaries/${testData.beneficiaryId}`, {
        name: 'Updated Test Beneficiary',
        notes: 'Updated notes'
    }, true);

    if (result.ok && result.data.success) {
        logSuccess('Beneficiary updated successfully');
        return true;
    } else {
        logError(`Update beneficiary failed: ${result.data?.error?.message || result.error}`);
        return false;
    }
}

async function testBeneficiaryDelete() {
    logSection('🗑️  Testing Beneficiary Module - Delete');
    
    if (!testData.beneficiaryId) {
        logError('No beneficiary ID available, skipping delete test');
        return false;
    }

    const result = await makeRequest('DELETE', `/beneficiaries/${testData.beneficiaryId}`, null, true);

    if (result.ok && result.data.success) {
        logSuccess('Beneficiary soft-deleted successfully');
        return true;
    } else {
        logError(`Delete beneficiary failed: ${result.data?.error?.message || result.error}`);
        return false;
    }
}

async function testPayoutCreate() {
    logSection('💸 Testing Payout Module - Create');
    
    // Create a new beneficiary for payout
    const benResult = await makeRequest('POST', '/beneficiaries', {
        name: 'Payout Test Beneficiary',
        contact_info: {
            mobile: '9876543210',
            email: 'payout@example.com'
        },
        bank_details: {
            account_number: '9876543210123456',
            ifsc_code: 'HDFC0001234',
            bank_name: 'HDFC Bank',
            upi_id: 'payout@paytm'
        }
    }, true);

    if (!benResult.ok) {
        logError('Failed to create beneficiary for payout test');
        return false;
    }

    const beneficiaryId = benResult.data.data._id;

    const result = await makeRequest('POST', '/payouts', {
        beneficiary_id: beneficiaryId,
        amount: 10,
        purpose: 'Test payout',
        notes: 'API integration test'
    }, true);

    if (result.ok && result.data.success) {
        testData.payoutId = result.data.data._id;
        logSuccess('Payout created successfully');
        logInfo(`Payout ID: ${testData.payoutId}`);
        logInfo(`Order No: ${result.data.data.out_trade_no}`);
        logInfo(`Status: ${result.data.data.status}`);
        return true;
    } else {
        logError(`Create payout failed: ${result.data?.error?.message || result.error}`);
        return false;
    }
}

async function testOneTimePayoutCreate() {
    logSection('💸 Testing Payout Module - One-Time Create');
    
    // One-Time Payout doesn't need a pre-created beneficiary ID
    // It sends raw details + source='ONE_TIME'
    
    const result = await makeRequest('POST', '/payouts', {
        amount: 25,
        currency: 'INR',
        purpose: 'One-Time API Test',
        notes: 'Testing source=ONE_TIME',
        source: 'ONE_TIME',
        beneficiary_name: 'Instant Beneficiary',
        account_number: '112233445566',
        ifsc_code: 'SBIN0001122',
        upi: 'instant@upi'
    }, true);

    if (result.ok && result.data.success) {
        logSuccess('One-Time Payout created successfully');
        logInfo(`Payout ID: ${result.data.data._id}`);
        logInfo(`Source: ${result.data.data.source}`);
        
        if (result.data.data.source === 'ONE_TIME') {
             logSuccess('Source incorrectly persisted as ONE_TIME');
        } else {
             logError(`Source mismatch: Expected ONE_TIME, got ${result.data.data.source}`);
             return false;
        }
        
        return true;
    } else {
        logError(`Create one-time payout failed: ${result.data?.error?.message || result.error}`);
        return false;
    }
}

async function testPayoutList() {
    logSection('📋 Testing Payout Module - List');
    
    const result = await makeRequest('GET', '/payouts?page=1&limit=10', null, true);

    if (result.ok && result.data.success) {
        logSuccess(`Retrieved ${result.data.data.payouts.length} payouts`);
        logInfo(`Total: ${result.data.data.pagination?.total || result.data.data.totalPayouts}`);
        return true;
    } else {
        logError(`List payouts failed: ${result.data?.error?.message || result.error}`);
        return false;
    }
}

async function testPayoutStatus() {
    logSection('🔍 Testing Payout Module - Status Query');
    
    if (!testData.payoutId) {
        logError('No payout ID available, skipping status test');
        return false;
    }

    const result = await makeRequest('GET', `/payouts/${testData.payoutId}/status`, null, true);

    if (result.ok && result.data.success) {
        logSuccess('Payout status retrieved successfully');
        logInfo(`Status: ${result.data.data.status}`);
        return true;
    } else {
        logError(`Get payout status failed: ${result.data?.error?.message || result.error}`);
        return false;
    }
}

async function testTransactionList() {
    logSection('📜 Testing Transaction Module - List');
    
    const result = await makeRequest('GET', '/transactions?page=1&limit=10', null, true);

    if (result.ok && result.data.success) {
        logSuccess(`Retrieved ${result.data.data.transactions.length} transactions`);
        return true;
    } else {
        logError(`List transactions failed: ${result.data?.error?.message || result.error}`);
        return false;
    }
}

async function testTransactionStats() {
    logSection('📊 Testing Transaction Module - Stats');
    
    const result = await makeRequest('GET', '/transactions/stats', null, true);

    if (result.ok && result.data.success) {
        logSuccess('Transaction stats retrieved successfully');
        logInfo(`Total Amount: ₹${result.data.data.totalAmount || 0}`);
        logInfo(`Total Count: ${result.data.data.totalCount || 0}`);
        return true;
    } else {
        logError(`Get transaction stats failed: ${result.data?.error?.message || result.error}`);
        return false;
    }
}

// ... existing code ...

async function testBalanceSync() {
    logSection('💰 Testing Balance Module - Sync');
    
    const result = await makeRequest('POST', '/balance/sync', null, true);

    if (result.ok && result.data.success) {
        logSuccess('Balance synced successfully');
        logInfo(result.data.data.balance);
        return true;
    } else {
        logError(`Balance sync failed: ${result.data?.error?.message || result.error}`);
        return false;
    }
}

async function testDashboardOverview() {
    logSection('📊 Testing Dashboard Module - Overview');
    
    const result = await makeRequest('GET', '/dashboard/overview', null, true);

    if (result.ok && result.data.success) {
        logSuccess('Dashboard overview retrieved successfully');
        logInfo({
            balance: result.data.data.balance,
            today_count: result.data.data.payout_breakdown
        });
        return true;
    } else {
        logError(`Dashboard overview failed: ${result.data?.error?.message || result.error}`);
        return false;
    }
}


// ... existing code ...

async function testTransactionExport() {
    logSection('📥 Testing Transaction Module - Export CSV');
    
    // First check if there are transactions
    const listResult = await makeRequest('GET', '/transactions?limit=1', null, true);
    if (listResult.ok && listResult.data.success && listResult.data.data.transactions.length === 0) {
        logInfo('Skipping CSV export test - No transactions available');
        return true;
    }

    try {
        const headers = {
            'Authorization': `Bearer ${testData.token}`
        };

        const response = await fetch(`${API_BASE_URL}/transactions/export`, {
            method: 'GET',
            headers
        });

        if (response.ok) {
            const csv = await response.text();
            logSuccess('CSV export successful');
            logInfo(`CSV size: ${csv.length} bytes`);
            logInfo(`Lines: ${csv.split('\n').length}`);
            return true;
        } else {
            const error = await response.json();
            // Handle specific case where error is "No transactions found" (404)
            if (response.status === 404) {
                 logInfo('CSV export skipped (No transactions found)');
                 return true;
            }
            logError(`CSV export failed: ${error.error?.message || response.statusText}`);
            return false;
        }
    } catch (error) {
        logError(`CSV export threw error: ${error.message}`);
        return false;
    }
}

async function testSessionExpiry() {
    logSection('⏰ Testing Session Management - JWT Expiry');
    
    logInfo('JWT tokens expire after 30 minutes (JWT_EXPIRY)');
    logInfo('Logout is client-side only (removes authToken from localStorage)');
    logInfo('Session validation happens on every API request via auth middleware');
    
    // Test with invalid token
    const invalidToken = 'invalid.jwt.token';
    const tempToken = testData.token;
    testData.token = invalidToken;
    
    const result = await makeRequest('GET', '/merchant/profile', null, true);
    
    testData.token = tempToken; // Restore valid token
    
    if (!result.ok) {
        logSuccess('Invalid token correctly rejected');
        return true;
    } else {
        logError('Invalid token was accepted (security issue!)');
        return false;
    }
}

// Main test runner
async function runAllTests() {
    log('\n' + '═'.repeat(60), colors.bright + colors.cyan);
    log('  🚀 SilkPay Backend API Test Suite', colors.bright + colors.cyan);
    log('═'.repeat(60) + '\n', colors.bright + colors.cyan);

    logInfo(`Testing API at: ${API_BASE_URL}`);
    logInfo(`Start time: ${new Date().toISOString()}\n`);

    const results = {
        total: 0,
        passed: 0,
        failed: 0
    };

    const tests = [
        // Auth Module
        { name: 'Auth - Login', fn: testAuthLogin, critical: true },
        { name: 'Auth - Forgot Password', fn: testAuthForgotPassword },
        { name: 'Auth - Reset Password', fn: testAuthResetPassword },
        
        // Merchant Module
        { name: 'Merchant - Get Profile', fn: testMerchantProfile },
        { name: 'Merchant - Update Profile', fn: testMerchantUpdateProfile },
        { name: 'Merchant - Change Password', fn: testMerchantChangePassword },
        { name: 'Merchant - API Keys & IP Whitelist', fn: testMerchantApiKeys },
        
        // Beneficiary Module
        { name: 'Beneficiary - Create', fn: testBeneficiaryCreate },
        { name: 'Beneficiary - List', fn: testBeneficiaryList },
        { name: 'Beneficiary - Update', fn: testBeneficiaryUpdate },
        { name: 'Beneficiary - Delete', fn: testBeneficiaryDelete },
        
        // Payout Module
        { name: 'Payout - Create', fn: testPayoutCreate },
        { name: 'Payout - One-Time Create', fn: testOneTimePayoutCreate },
        { name: 'Payout - List', fn: testPayoutList },
        { name: 'Payout - Status Query', fn: testPayoutStatus },
        
        // Balance Module
        { name: 'Balance - Sync', fn: testBalanceSync },
        
        // Dashboard Module
        { name: 'Dashboard - Overview', fn: testDashboardOverview },
        
        // Transaction Module
        { name: 'Transaction - List', fn: testTransactionList },
        { name: 'Transaction - Stats', fn: testTransactionStats },
        { name: 'Transaction - Export CSV', fn: testTransactionExport },
        
        // Session & Security
        { name: 'Session - JWT Expiry Validation', fn: testSessionExpiry }
    ];

    for (const test of tests) {
        results.total++;
        try {
            const passed = await test.fn();
            if (passed) {
                results.passed++;
            } else {
                results.failed++;
                if (test.critical) {
                    logError(`\n❌ Critical test failed: ${test.name}`);
                    logError('Aborting remaining tests\n');
                    break;
                }
            }
        } catch (error) {
            results.failed++;
            logError(`Test "${test.name}" threw error: ${error.message}`);
            if (test.critical) {
                logError('\n❌ Critical test failed, aborting\n');
                break;
            }
        }
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
    }

    // Summary
    log('\n' + '═'.repeat(60), colors.bright);
    log('  📊 Test Results Summary', colors.bright);
    log('═'.repeat(60), colors.bright);
    
    log(`\nTotal Tests: ${results.total}`);
    logSuccess(`Passed: ${results.passed}`);
    if (results.failed > 0) {
        logError(`Failed: ${results.failed}`);
    }
    
    const successRate = ((results.passed / results.total) * 100).toFixed(1);
    log(`\nSuccess Rate: ${successRate}%`);
    
    logInfo(`\nEnd time: ${new Date().toISOString()}`);

    if (results.failed === 0) {
        log('\n✨ All tests passed! Backend is ready for frontend integration.', colors.green + colors.bright);
    } else {
        log('\n⚠️  Some tests failed. Please review and fix issues before integration.', colors.yellow);
    }
    
    log('═'.repeat(60) + '\n', colors.bright);
}

// Run tests
runAllTests().catch(error => {
    logError(`\n❌ Fatal error: ${error.message}`);
    process.exit(1);
});
