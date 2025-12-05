import http from "k6/http";
import { check, sleep, group } from "k6";

export const options = {
  vus: 5,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests < 500ms
    http_req_failed: ["rate<0.01"], // Error rate < 1%
    "group_duration{group:::get-products}": ["p(95)<300"],
    "group_duration{group:::create-user}": ["p(95)<400"],
    "group_duration{group:::login}": ["p(95)<400"],
    "group_duration{group:::checkout}": ["p(95)<600"],
  },
};

const BASE_URL = "http://localhost:3000";

export default function () {
  let authToken = "";

  group("get-products", function () {
    const productsRes = http.get(`${BASE_URL}/products`);
    check(productsRes, {
      "get products status 200": (r) => r.status === 200,
      "products is array": (r) => Array.isArray(JSON.parse(r.body)),
    });
  });

  sleep(1);

  group("create-user", function () {
    const uniqueEmail = `user_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}@example.com`;

    const registerRes = http.post(
      `${BASE_URL}/auth/register`,
      JSON.stringify({
        email: uniqueEmail,
        password: "testPassword123",
        name: "Test User",
      }),
      { headers: { "Content-Type": "application/json" } }
    );

    check(registerRes, {
      "register status 200": (r) => r.status === 200,
      "register returns message": (r) =>
        JSON.parse(r.body).message !== undefined,
    });
  });

  sleep(1);

  group("login", function () {
    const loginRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({
        email: "john@example.com",
        password: "password123",
      }),
      { headers: { "Content-Type": "application/json" } }
    );

    check(loginRes, {
      "login status 200": (r) => r.status === 200,
      "login returns token": (r) => JSON.parse(r.body).token !== undefined,
    });

    if (loginRes.status === 200) {
      authToken = JSON.parse(loginRes.body).token;
    }
  });

  sleep(1);

  if (authToken) {
    group("checkout", function () {
      const checkoutRes = http.post(
        `${BASE_URL}/checkout`,
        JSON.stringify({
          items: [{ productId: 1, quantity: 1 }],
          paymentMethod: "cash",
        }),
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      check(checkoutRes, {
        "checkout status 200": (r) => r.status === 200,
        "checkout returns orderId": (r) => {
          try {
            return JSON.parse(r.body).orderId !== undefined;
          } catch {
            return false;
          }
        },
      });
    });
  }

  sleep(1);
}
