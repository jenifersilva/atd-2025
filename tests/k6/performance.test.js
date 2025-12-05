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
  const uniqueEmail = `user_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}@example.com`;
  const password = "testPassword123";

  group("create-user", function () {
    const registerRes = http.post(
      `${BASE_URL}/auth/register`,
      JSON.stringify({
        email: uniqueEmail,
        password: password,
        name: "Test User",
      }),
      { headers: { "Content-Type": "application/json" } }
    );

    check(registerRes, {
      "register status 201": (r) => r.status === 201,
      "register success": (r) => {
        try {
          return JSON.parse(r.body).success === true;
        } catch {
          return false;
        }
      },
    });
  });

  sleep(1);

  group("login", function () {
    const loginRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({
        email: uniqueEmail,
        password: password,
      }),
      { headers: { "Content-Type": "application/json" } }
    );

    check(loginRes, {
      "login status 200": (r) => r.status === 200,
      "login returns token": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true && body.data?.token !== undefined;
        } catch {
          return false;
        }
      },
    });

    const responseBody = JSON.parse(loginRes.body);
    authToken = responseBody.data.token;
  });

  sleep(1);

  let firstProductId = 0;
  group("get-products", function () {
    const productsRes = http.get(`${BASE_URL}/products`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    check(productsRes, {
      "get products status 200": (r) => r.status === 200,
      "products data exists": (r) => {
        try {
          const body = JSON.parse(r.body);
          firstProductId = body.data[0].id;
          return body.success === true && Array.isArray(body.data);
        } catch {
          return false;
        }
      },
    });
  });

  sleep(1);

  group("checkout", function () {
    const checkoutRes = http.post(
      `${BASE_URL}/checkout`,
      JSON.stringify({
        items: [{ productId: firstProductId, quantity: 1 }],
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
      "checkout success": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true && body.data?.id !== undefined;
        } catch {
          return false;
        }
      },
    });
  });

  sleep(1);
}
