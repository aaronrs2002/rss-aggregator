const paths = [{
    rssEndpoint: "https://mechanized-aesthetics.net/php-relays/social-app-rss.php?q=",
}];/*test: 
https://web-presence-news.blogspot.com/feeds/posts/default?alt=rss 
*/

let obj = [];
let search = "";



function grabData(whichAddress) {
    let address = whichAddress;
    if (whichAddress === null) {
        address = document.getElementById("feedAddress").value;
    }

    if (address.indexOf("http") === -1) {
        globalAlert("alert-danger", "we are going to need a web address.")
        return false;

    }

    // setObj((obj) => []);
    obj = [];
    fetch(paths[0].rssEndpoint + address
    )

        .then((response) => response.json())
        .then(
            (data) => {
                // setObj((obj) => data);

                obj = data;
                try {
                    if (obj[0].title) {
                        document.querySelector("[name='filter']").classList.remove("hide");
                    }
                } catch (error) {

                    globalAlert("alert-warning", "This RSS data does not look correct.");
                    return false;
                }

                objHTML = "";
                for (let i = 0; i < obj.length; i++) {

                    obj[i].title = obj[i].title.replaceAll("'", "").replaceAll('"', '');
                    //  obj[i].title = obj[i].description.replaceAll("'", "&#39;").replace('"', '&#34;');
                    objHTML = objHTML + `<li  class='list-group-item ' data-num='${i}' ><label class=' pointer'  onClick="toggle('${obj[i].title.trim()}')">${obj[i].title}</label><div class='hide' data-toggle='${obj[i].title.trim()}'><p>${obj[i].description}</p><small><i>${obj[i].pubDate} - <a href='${obj[i].guid}' target='_blank'>Article Link</a></i></small></div></li>`


                    document.getElementById("objTarget").innerHTML = objHTML;
                }





                /*
{"title":"Basset Hounds play “King of the Mountain”",
"link":"https://our-basset-hounds.blogspot.com/2023/11/basset-hounds-play-king-of-mountain.html",
"description":"<iframe style=\"width: 100%; height: auto; min-height: 270px;\" src=\"https://www.youtube.com/embed/_3iR1IWDtxA\" title=\"YouTube video player\" frameborder=\"0\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture\" allowfullscreen></iframe>\n",
"pubDate":"Sun, 12 Nov 2023 11:26:00 ",
"guid":"tag:blogger.com,1999:blog-4074357836862008169.post-7672672372116690557"}
                */
            },

            (error) => {
                console.log("fetch error: " + error);
            }
        );


}


function searchBuzzWord() {

    let searchFor = document.querySelector("input[name='filter']").value;
    searchFor = searchFor.toLowerCase();

    for (let i = 0; i < obj.length; i++) {
        let searchStr = (obj[i].title + obj[i].description).toLowerCase();
        if (searchStr.indexOf(searchFor) === -1) {
            document.querySelector("li[data-num='" + i + "']").classList.add("hide");
        } else {
            document.querySelector("li[data-num='" + i + "']").classList.remove("hide");
        }
    }


}