const fs = require("fs");
const fetch = require("node-fetch");

const animes = require("./animes.json");
const blacklist = require("./blacklist.json");
const usernames = [
  "Theya",
  "gnf5",
  "LlennW",
  "Endersteph",
  "Volcanios",
  "Foussilin",
];

const query = `
query ($userName: String) {
  anime: MediaListCollection(userName: $userName, type: ANIME) {
    lists {
      entries {
        media {   
          bannerImage
          coverImage {
            extraLarge
            color
          }
          title {
            romaji
            english
          }
          format
          popularity
          status
          synonyms
        }
      }
    }
  }
}
`;

function getAnimesFromList(list) {
  list.entries.forEach((e) => {
    // Skipping undesired animes.
    if (blacklist.some((a) => a == e.media.title.romaji))
      return
    if (animes.some((a) => a.reponse == e.media.title.romaji)) return;

    const format = e.media.format == null ? null : e.media.format.toLowerCase();
    if (format == null) return;
    if (format == "music" || format == "special" || format == "ova") return;

    if (e.media.status == "NOT_YET_RELEASED") return;

    // Proccess animes
    if (e.media.title.english) e.media.synonyms.push(e.media.title.english);

    if (e.media.popularity >= 100000) var difficulty = "easy";
    else if (e.media.popularity >= 50000) var difficulty = "medium";
    else var difficulty = "hard";

    const regEx = /^[a-zA-ZÀ-ÖØ-öø-ÿ0-9!@#$%^&*()_+\-=\[\]{};'’`~:"\\|,.<>\/? ]+$/;
    e.media.synonyms = e.media.synonyms.filter(
      (y) => y != e.media.title.romaji && regEx.test(y)
    );
    const anime = {
      image: e.media.coverImage.extraLarge,
      reponse: e.media.title.romaji,
      synonyms: e.media.synonyms,
      difficulty: difficulty,
      categorie: "Anime",
    };
    animes.push(anime);

    console.log(anime.reponse + " Ajouté !");
  });
}

function loadAnime(user) {
  // Define our query variables and values that will be used in the query request
  let variables = {
    userName: user,
  };

  // Define the config we'll need for our Api request
  let url = "https://graphql.anilist.co",
    options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: query,
        variables: variables,
      }),
    };

  // Make the HTTP Api request
  fetch(url, options).then(handleResponse).then(handleData).catch(handleError);

  function handleResponse(response) {
    return response.json().then(function (json) {
      return response.ok ? json : Promise.reject(json);
    });
  }

  function handleData(data) {
    console.log("------------------------ Anime List: " + user);
    data.data.anime.lists.forEach(getAnimesFromList);
    fs.writeFileSync("./animes.json", JSON.stringify(animes));
  }

  function handleError(error) {
    console.error(error);
  }
}
usernames.forEach(loadAnime);
