import { Configuration, PlaidApi, PlaidEnvironments, Products } from "plaid";

const envName = (process.env.PLAID_ENV || "sandbox") as keyof typeof PlaidEnvironments;

const config = new Configuration({
  basePath: PlaidEnvironments[envName],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID || "",
      "PLAID-SECRET": process.env.PLAID_SECRET || "",
    },
  },
});

export const plaid = new PlaidApi(config);
export const plaidProducts = [Products.Transactions, Products.Investments];
