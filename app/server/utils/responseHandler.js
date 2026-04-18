
export function successResponse(data, message = "Success", status = 200, headers = {
    "Content-Type": "application/json",
}) {
    return new Response(
        JSON.stringify({
            success: true,
            message,
            data: data,
        }),
        {
            status,
            headers
        }
    );
}

export function errorResponse(message = "Something went wrong", status = 500, headers = {
    "Content-Type": "application/json",
}) {
    return new Response(
        JSON.stringify({
            success: false,
            message,
        }),
        {
            status,
            headers,
        }
    );
}