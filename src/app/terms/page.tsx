import { Separator } from "@/components/ui/separator";

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed mt-20">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">
          Terms of Service
        </h1>
        <p className="text-gray-500">Effective Date: June 2026</p>
      </div>

      <Separator />

      <p>
        Welcome to our platform. By accessing or using our website, services, and online store, you agree to be bound by these Terms of Service. Please review them carefully before creating an account or placing an order.
      </p>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-6">
        1. Account Registration
      </h2>
      <p>
        When you create an account, you must provide accurate, complete, and updated information. You are responsible for safeguarding your login credentials and for any activity that occurs under your account.
      </p>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-6">
        2. Orders & Payments
      </h2>
      <p>
        All orders placed through our store are subject to availability and order confirmation. We reserve the right to refuse or cancel any order for reasons including pricing inaccuracies, product unavailability, or suspected fraudulent activity.
      </p>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-6">
        3. Delivery & Returns
      </h2>
      <p>
        Delivery timeframes and charges are outlined at checkout. For returns and exchanges, please refer to our dedicated{" "}
        <a href="/return-policy" className="text-primary underline">
          Return Policy
        </a>
        .
      </p>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-6">
        4. User Conduct
      </h2>
      <p>
        You agree not to misuse our website, attempt unauthorized access to our systems, or engage in any conduct that violates applicable laws or regulations.
      </p>
    </div>
  );
}

