async function test() {
    const OPENROUTER_API_KEY = "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";
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "model": "arcee-ai/trinity-large-preview:free",
                "messages": [
                    { "role": "user", "content": "Hello!" }
                ]
            })
        });

        console.log("Status:", response.status);
        const data = await response.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}
test();
