// Only execution-container compatibility flags. Keep normal same-origin,
// mixed-content, site-isolation and graphics defaults for trustworthy audits.
export const chromiumArgs = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--no-zygote'];
