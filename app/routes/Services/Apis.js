export class API_SERVICES {

    // Step 1 of sign-up: emails an OTP to the user. payload = { name, email, password }
    async sendSignupOtp(payload) {
        try {
            const res = await fetch("/api/user/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });
            return await res.json();
        }
        catch (error) {
            console.error("Error on sendSignupOtp API-------------", error);
            throw error;
        }
    }

    // Step 2 of sign-up: verifies the OTP and creates the account. payload = { email, otp }
    async sign_up(payload) {
        try {
            const res = await fetch("/api/user/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            const responseData = await res.json();
            console.log("data==========", responseData);

            return responseData;
        }
        catch (error) {
            console.error("Error on sign_up API-------------", error);
            throw error; // important
        }
    }
    async  login (payload) {
        try {
            const res = await fetch("/api/user/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });
            const responseData = await res.json();
            console.log("login data========== ", responseData);
            return responseData;
        }
        catch (error) {
            console.error("Error on login API-------------", error);
            throw error; // important
        }
    }

    async googleLogin(idToken) {
        try {
            const res = await fetch("/api/user/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ idToken }),
            });
            return await res.json();
        } catch (error) {
            console.error("Error on googleLogin API-------------", error);
            throw error;
        }
    }

    async logout() {
        try {
            const res = await fetch("/api/user/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({}),
            });

            const responseData = await res.json();
            console.log("logout data------------------", responseData);
            return responseData;
        } catch (error) {
            console.error("Error on logout API-------------", error);
            throw error;
        }
    }

    async createProduct(formData) {
        try {
            const res = await fetch("/api/product/createproduct", {
                method: "POST",
                credentials: "include",
                body: formData,
            });
            return await res.json();
        } catch (error) {
            console.error("Error on createProduct API-------------", error);
            throw error;
        }
    }

    async updateProduct(formData) {
        try {
            const res = await fetch("/api/product/update", {
                method: "POST",
                credentials: "include",
                body: formData,
            });
            return await res.json();
        } catch (error) {
            console.error("Error on updateProduct API-------------", error);
            throw error;
        }
    }

    async deleteProduct(id) {
        try {
            const res = await fetch("/api/product/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ id }),
            });
            return await res.json();
        } catch (error) {
            console.error("Error on deleteProduct API-------------", error);
            throw error;
        }
    }

    async createMerchant(payload) {
        console.log("--------------------------------test1");

        try {
            const res = await fetch("/api/merchant/createmerchant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const responseData = await res.json();
            console.log("create merchant data---------------", responseData);
            return responseData;
        } catch (error) {
            console.error("Error on createMerchant API-------------", error);
            throw error;
        }
    }

    // ---- PhonePe payment APIs ----

    // Save/update the authenticated merchant's PhonePe details.
    async savePhonePeSettings(payload) {
        try {
            const res = await fetch("/api/merchant/payment-setup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });
            return await res.json();
        } catch (error) {
            console.error("Error on savePhonePeSettings API-------------", error);
            throw error;
        }
    }

    // Read current PhonePe settings for the authenticated merchant.
    async getPhonePeSettings() {
        try {
            const res = await fetch("/api/merchant/payment-setup", {
                method: "GET",
                credentials: "include",
            });
            return await res.json();
        } catch (error) {
            console.error("Error on getPhonePeSettings API-------------", error);
            throw error;
        }
    }

    // Paginated merchant payment history.
    async getMerchantPayments({ page = 1, limit = 10, status } = {}) {
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(limit) });
            if (status) params.set("status", status);
            const res = await fetch(`/api/merchant/payments?${params.toString()}`, {
                method: "GET",
                credentials: "include",
            });
            return await res.json();
        } catch (error) {
            console.error("Error on getMerchantPayments API-------------", error);
            throw error;
        }
    }

    // Create an order-specific PhonePe Dynamic QR. `items` = [{ productId, quantity, variant }].
    async createPaymentQr(items) {
        try {
            const res = await fetch("/api/payment/phonepe/create-qr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ items }),
            });
            return await res.json();
        } catch (error) {
            console.error("Error on createPaymentQr API-------------", error);
            throw error;
        }
    }

    // Poll the payment status for an order (used while the QR modal is open).
    async getPaymentStatus(orderId) {
        try {
            const res = await fetch(`/api/payment/status/${encodeURIComponent(orderId)}`, {
                method: "GET",
                credentials: "include",
            });
            return await res.json();
        } catch (error) {
            console.error("Error on getPaymentStatus API-------------", error);
            throw error;
        }
    }
}
