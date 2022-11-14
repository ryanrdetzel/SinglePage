import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import React, { useEffect, useState } from "react";

import { urlValidState } from "../../types/project";

interface CheckoutFormProps {
  publishPage: () => Promise<string>;
  url: string;
  urlIsValid: urlValidState;
}

export default function CheckoutForm({
  publishPage,
  url,
  urlIsValid,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState<null | string | undefined>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = React.useState(false);
  const [agreeSecret, setAgreeSecret] = React.useState(false);
  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );
    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (paymentIntent) {
        switch (paymentIntent.status) {
          case "succeeded":
            break;
          case "processing":
            break;
          case "requires_payment_method":
            setMessage("Your payment was not successful, please try again.");
            break;
          default:
            setMessage("Something went wrong.");
            break;
        }
      }
    });
  }, [stripe]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setMessage("");
    setIsLoading(true);

    // First publish the page.
    const id = await publishPage();

    if (id) {
      const publishingUrl =
        process.env.NODE_ENV === "development"
          ? `https://beta.singlepage.cc/publishing.html?url=${url}`
          : `https://${window.location.hostname}/publishing.html?url=${url}`;
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: publishingUrl,
        },
      });

      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message);
      } else {
        setMessage("An unexpected error occurred.");
      }
    } else {
      setMessage("Something went wrong and we couldn't publish this page");
    }
    setIsLoading(false);
  };

  const validUrl = urlIsValid === urlValidState.Valid;

  // 4242 4242 4242 4242
  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" />
      <p style={{ marginTop: "15px" }}>
        <label style={{ margin: 0 }}>
          <input
            className="form-check-input"
            type="checkbox"
            value=""
            onChange={(e) => setAgreeTerms(e.currentTarget.checked)}
          />{" "}
          I agree to the <a href="#">terms and conditions</a>
        </label>
        <br />
        <label>
          <input
            className="form-check-input"
            type="checkbox"
            value=""
            onChange={(e) => setAgreeSecret(e.currentTarget.checked)}
          />{" "}
          I have saved by secret phase and{" "}
          <a href="#">understand how to use it</a>
        </label>
      </p>
      <button
        id="submit"
        className="btn btn-custom btn-sm"
        disabled={
          isLoading ||
          !stripe ||
          !elements ||
          !agreeSecret ||
          !agreeTerms ||
          !validUrl
        }
      >
        <span id="button-text">
          {isLoading ? "Publishing..." : "Pay and Publish Page"}
        </span>
      </button>

      <ul style={{ paddingTop: "8px", listStyle: "none" }}>
        {!validUrl && (
          <li className="text-danger">
            Enter a valid URL at the top of the page to enable publishing
          </li>
        )}

        {!agreeTerms && (
          <li className="text-danger">
            Agree to the terms and conditions to enable publishing
          </li>
        )}

        {!agreeSecret && (
          <li className="text-danger">
            Confirm above you understand how to use your secret phrase
          </li>
        )}
      </ul>

      {message && (
        <div
          id="payment-message"
          className="text-danger font-weight-bold"
          style={{ padding: "10px" }}
        >
          {message}
        </div>
      )}
    </form>
  );
}
