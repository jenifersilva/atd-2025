import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 5,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% das requisições < 500ms
    http_req_failed: ["rate<0.01"], // Taxa de erro < 1%
  },
};

const BASE_URL = "http://localhost:3000";
let authToken = "";

export default function () {
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: "john@example.com",
      password: "password123",
    }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(loginRes, {
    "login ok": (r) => r.status === 200,
  });

  if (loginRes.status === 200) {
    authToken = JSON.parse(loginRes.body).token;
  }
}
