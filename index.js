const fs = require("fs");
const fetch = require("node-fetch");

const animes = require("./animes.json");
const usernames = ["Theya", "gnf5", "LlennW", "Endersteph"];

function loadAnime(user) {
  var query = `
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

  // Define our query variables and values that will be used in the query request
  var variables = {
    userName: user,
  };

  // Define the config we'll need for our Api request
  var url = "https://graphql.anilist.co",
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
    const minPopularity = 0;
    /*
  EASY: 80000 - 100000
  NORMAL: 40000 - 60000
  HARD: 0  
  */
    data.data.anime.lists.forEach((list) => {
      list.entries.forEach((e) => {
        if (!animes.some((a) => a.reponse == e.media.title.romaji)) {
          if (e.media.format != null && e.media.popularity >= minPopularity && e.media.status != "NOT_YET_RELEASED") {
            const format = e.media.format.toLowerCase();
            if (format != "music" && format != "special" && format != "ova") {
              if (e.media.title.english)
                e.media.synonyms.push(e.media.title.english);
              let difficulty;
              if (e.media.popularity >= 100000) difficulty = "easy";
              else if (e.media.popularity >= 50000) difficulty = "medium";
              else difficulty = "hard";
              const anime = {
                image: e.media.coverImage.extraLarge,
                reponse: e.media.title.romaji,
                synonyms: e.media.synonyms,
                difficulty: difficulty,
                categorie: "Anime",
              };
              console.log(anime.reponse + " Ajouté !");
              animes.push(anime);
            }
          }
        }
      });
    });
    console.log(animes.length);
    fs.writeFileSync("./animes.json", JSON.stringify(animes));
  }

  function handleError(error) {
    console.error(error);
  }
}
usernames.forEach((e) => {
  loadAnime(e);
});
