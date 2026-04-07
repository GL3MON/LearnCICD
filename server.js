const express = require("express")
const client = require("prom-client")

const app = express()

const register = new client.Registry()
client.collectDefaultMetrics({register})

const httpRequestDuration = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request latency in seconds",
    labelNames: ["method", "route", "status"],
    buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5]
})

register.registerMetric(httpRequestDuration)

function prometheusMiddleware(req, res, next) {
    const start = process.hrtime()

    res.on("finish", () => {
        const diff = process.hrtime(start)
        const duration = diff[0] + diff[1]/1e9;
        
        httpRequestDuration.labels(
            req.method,
            req.route ? req.route.path : req.path,
            res.statusCode
        ).observe(duration)

    })

    next()

}

app.use(prometheusMiddleware)

async function getLocation() {
    const data = await (await fetch("http://ip-api.com/json/")).json()
    console.log(data)

    return {
        latitude: data.lat,
        longitude: data.lon,
        city: data.city,
        region: data.regionName,
        country: data.country,
        isp: data.isp
    };
}

app.get("/gps", async (req, res) => {
    const location = await getLocation()
    res.json(location)
})

app.get("/metrics", async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics())
})

app.listen(3000)