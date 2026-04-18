export class API_SERVICES {

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
}
