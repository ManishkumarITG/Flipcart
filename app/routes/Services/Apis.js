export class API_SERVICES {

    async sign_up(payload) {
        try {
            const res = await fetch("/api/user/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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
                body: JSON.stringify(payload)
            });
            const responseData = await res.json();
            console.log("login data==========", responseData);
            return responseData;
        }
        catch (error) {
            console.error("Error on login API-------------", error);
            throw error; // important
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
            console.log("logout data==========", responseData);
            return responseData;
        } catch (error) {
            console.error("Error on logout API-------------", error);
            throw error;
        }
    }

    async createMerchant(payload) {
        try {
            const res = await fetch("/api/merchant/createmerchant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const responseData = await res.json();
            console.log("create merchant data==========", responseData);
            return responseData;
        } catch (error) {
            console.error("Error on createMerchant API-------------", error);
            throw error;
        }
    }
}
