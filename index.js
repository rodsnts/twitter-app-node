const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const port = process.env.PORT || 4000;

const bearerToken =
  "AAAAAAAAAAAAAAAAAAAAAMdFYAEAAAAAMwcQqDEXKa5Y0J9g9%2FDo43YT1HI%3D4nbxP16XvJF0APPdVzKPodCQbNFuP0RID3mWUX9GzFsW5x9C4i";

const rulesUrl = "https://api.twitter.com/2/tweets/search/stream/rules";

const streamUrl =
  "https://api.twitter.com/2/tweets/search/stream?tweet.fields=created_at&expansions=author_id,attachments.media_keys&user.fields=username&media.fields=preview_image_url";

const tweetsUrl =
  "https://api.twitter.com/2/tweets/search/recent?query=from:ItsTradeNation&tweet.fields=created_at&expansions=author_id,attachments.media_keys&user.fields=created_at&media.fields=preview_image_url";

app.get("/tweets", cors({ origin: "*" }), (req, res) => {
  axios({
    method: "get",
    url: tweetsUrl,
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  }).then((data) => {
    res.send(data.data);
  });
});

async function listRules() {
  axios({
    method: "get",
    url: rulesUrl,
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  }).then((res) => {
    console.log(res.data.data);
  });
}

async function addRules(string) {
  axios({
    method: "post",
    url: rulesUrl,
    headers: {
      contentType: "application/json",
      Authorization: `Bearer ${bearerToken}`,
    },
    data: {
      add: [
        {
          value: string,
        },
      ],
    },
  });
}

async function deleteRules(id) {
  axios({
    method: "post",
    url: rulesUrl,
    headers: {
      contentType: "application/json",
      Authorization: `Bearer ${bearerToken}`,
    },
    data: {
      delete: {
        ids: [id],
      },
    },
  });
}

async function streamTweets(socket) {
  axios({
    method: "get",
    url: streamUrl,
    responseType: "stream",
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  }).then((res) => {
    res.data.on("data", (data) => {
      try {
        const json = JSON.parse(data);
        socket.emit("tweet", json);
      } catch (err) {}
    });
  });
}

io.on("connection", async (socket) => {
  console.log("a user connected");

  try {
    await streamTweets(io);
  } catch (err) {
    console.log(err);
  }
});

server.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
