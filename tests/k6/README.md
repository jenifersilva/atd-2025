# Performance Testing with k6

## Installation

### 1. Install k6

**macOS (with Homebrew):**

```bash
brew install k6
```

**Or download directly:**
Visit https://k6.io/docs/getting-started/installation/

### 2. Verify installation

```bash
k6 version
```

## How to Run

### Prerequisites

Make sure the server is running:

```bash
npm run dev
```

### Execute the performance test

```bash
k6 run tests/k6/login.test.js
```

### Advanced execution options

**1. With detailed output:**

```bash
k6 run --vus 5 --duration 30s tests/k6/login.test.js
```

**2. Simulating gradual load:**

```bash
k6 run tests/k6/login.test.js
```

**3. With CSV report (using extension):**

```bash
k6 run --out csv=results.csv tests/k6/login.test.js
```

## What the test does

The test simulates real API usage with the following scenarios:

1. **Health Check** - Verifies application health
2. **Get Products** - Fetches the product list
3. **Authentication** - Logs in to obtain JWT token
4. **Checkout** - Performs an authenticated purchase

## Load Configuration

The test uses the following stages:

- **Ramp-up (30s):** Increase from 0 to 10 simultaneous users
- **Sustained (1m30s):** Maintains 10 simultaneous users
- **Ramp-down (30s):** Reduction from 10 to 0 users

**Total duration:** 2m30s

## Performance Thresholds

The test validates the following criteria:

- ✅ **P95 latency:** Less than 500ms
- ✅ **P99 latency:** Less than 1000ms
- ✅ **Error rate:** Less than 10%

## Understanding Results

When you run the test, you'll see a report with:

- **Requests made:** Total HTTP calls
- **Success/error rate:** Percentage of successful requests
- **Latency:** Response time (min, max, average, percentiles)
- **Throughput:** Requests per second

### Example output:

```
     checks.........................: 100% (400/400)
     data_received..................: 150 kB
     data_sent.......................: 80 kB
     http_req_blocked...............: avg=2ms
     http_req_connecting............: avg=1ms
     http_req_duration..............: avg=120ms p(95)=280ms p(99)=450ms
     http_req_failed................: 0%
     http_req_receiving.............: avg=10ms
     http_req_sending...............: avg=2ms
     http_req_tls_handshaking.......: avg=0ms
     http_reqs.......................: 400 (2.67/s)
     iteration_duration.............: avg=1.1s
     iterations.....................: 100
```

## Interpreting Metrics

- **checks:** Percentage of validations that passed
- **http_req_duration:** Total time for a request
- **http_req_failed:** Rate of failed requests
- **http_reqs:** Total requests made
- **iterations:** Number of completed cycles

## Custom Validations

The test automatically checks:

✅ HTTP 200 status on public endpoints  
✅ Token return on authentication  
✅ Valid data in responses  
✅ Authentication working correctly

## Next Steps

For more advanced testing, you can:

1. **Create multiple scenarios:** Different groups of VUs (Virtual Users) with different behaviors
2. **Add realistic data:** Use data files for more variety
3. **Integrate into CI/CD:** Automate tests on each deploy
4. **Detailed analysis:** Generate reports in JSON format or charts

## Additional Resources

- [Official k6 Documentation](https://k6.io/docs/)
- [k6 Test Examples](https://k6.io/docs/examples/)
- [k6 Community](https://community.k6.io/)
