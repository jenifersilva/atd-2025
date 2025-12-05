import http from "k6/http";
import { check, sleep, group } from "k6";

export const options = {
  vus: 5,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

const BASE_URL = "http://localhost:3000";

function parseJSON(body) {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function authenticate(email, password) {
  const response = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { "Content-Type": "application/json" } }
  );

  if (response.status === 200) {
    const body = parseJSON(response.body);
    return body?.data?.token || null;
  }
  return null;
}

export default function () {
  const uniqueEmail = `user_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}@example.com`;
  const password = "testPassword123";
  let authToken = "";
  let firstProductId = 1;

  group("create-user", function () {
    const res = http.post(
      `${BASE_URL}/auth/register`,
      JSON.stringify({ email: uniqueEmail, password, name: "Test User" }),
      { headers: { "Content-Type": "application/json" } }
    );

    check(res, {
      "user created": (r) => r.status === 201,
    });
  });

  sleep(1);

  group("login", function () {
    authToken = authenticate(uniqueEmail, password);
    check(authToken, {
      "token obtained": (token) => token !== null,
    });
  });

  sleep(1);

  group("get-products", function () {
    const res = http.get(`${BASE_URL}/products`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const body = parseJSON(res.body);
    if (body?.data?.length > 0) {
      firstProductId = body.data[0].id;
    }

    check(res, {
      "products retrieved": (r) => r.status === 200 && body?.data?.length > 0,
    });
  });

  sleep(1);

  group("checkout", function () {
    const res = http.post(
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

    const body = parseJSON(res.body);
    check(res, {
      "checkout successful": (r) => r.status === 200 && body?.success === true,
    });
  });

  sleep(1);
}
