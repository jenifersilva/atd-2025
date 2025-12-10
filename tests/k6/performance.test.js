import http from "k6/http";
import { check, sleep, group } from "k6";
import { login } from "./helpers/login.js";
import { randomEmail } from "./helpers/randomEmail.js";
import { getBaseUrl } from "./helpers/getBaseUrl.js";

export const options = {
  vus: 5,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

function parseJSON(body) {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

export default function () {
  const uniqueEmail = randomEmail();
  const password = "testPassword123";
  let authToken = "";
  let firstProductId = 1;

  group("create-user", function () {
    const res = http.post(
      `${getBaseUrl()}/auth/register`,
      JSON.stringify({ email: uniqueEmail, password, name: "Test User" }),
      { headers: { "Content-Type": "application/json" } }
    );

    check(res, {
      "user created": (r) => r.status === 201,
    });
  });

  sleep(1);

  group("login", function () {
    authToken = login(uniqueEmail, password);
    check(authToken, {
      "token obtained": (token) => token !== null,
    });
  });

  sleep(1);

  group("get-products", function () {
    const res = http.get(`${getBaseUrl()}/products`, {
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
      `${getBaseUrl()}/checkout`,
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
