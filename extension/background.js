"use strict";
// Background service worker to proxy requests to localhost backend
// This is needed because content scripts have restrictions accessing localhost
const BACKEND_URL = 'http://localhost:3000';
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request);
    // Handle the request asynchronously
    handleRequest(request)
        .then(response => {
        console.log('Sending response:', response);
        sendResponse({ success: true, data: response });
    })
        .catch(error => {
        console.error('Request error:', error);
        sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    });
    // Return true to indicate we will send a response asynchronously
    return true;
});
async function handleRequest(request) {
    const { type, ticker } = request;
    if (type === 'health-check') {
        const response = await fetch(`${BACKEND_URL}/health`, {
            method: 'GET',
            mode: 'cors'
        });
        if (!response.ok) {
            throw new Error(`Health check failed: ${response.status}`);
        }
        return await response.json();
    }
    if (!ticker) {
        throw new Error('Ticker is required');
    }
    let endpoint = '';
    if (type === 'analyze-market') {
        endpoint = '/api/analyze-market';
    }
    else if (type === 'analyze-comments') {
        endpoint = '/api/analyze-comments';
    }
    else {
        throw new Error(`Unknown request type: ${type}`);
    }
    console.log(`Making request to: ${BACKEND_URL}${endpoint} with ticker: ${ticker}`);
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
        mode: 'cors'
    });
    console.log(`Response status: ${response.status}`);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
}
