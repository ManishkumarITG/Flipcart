export class API_SERVICES {
    async sign_up(data) {
        try {
            const res = await fetch("/api/signup", {
                method: "POST",
                headers: {  "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            await res.json();
            return res.data;
        }
        catch (error) {
            console.error("Error on sign_up API-------------" , error);
        }
    }
}