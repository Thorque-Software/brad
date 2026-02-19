import { app } from "./app-joined";

const port = process.env.PORT || 3001;

app.listen(port, (err) => {
    if (err) {
        console.log("Error running the server", err);
    } else {
        console.log(`Server is running on port ${port}`);
    }
});
