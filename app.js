// Reduced file - need to credit appropriate sources before adding to something used by ExpControls

import dotenv from "dotenv";
import {App} from "octokit";
import {createNodeMiddleware} from "@octokit/webhooks";
import fs from "fs";
import http from "http";

import {graphql} from "@octokit/graphql";

// This reads your `.env` file and adds the variables from that file to the `process.env` object in Node.js.
dotenv.config();

// This assigns the values of your environment variables to local variables.
const appId = process.env.APP_ID;
const webhookSecret = process.env.WEBHOOK_SECRET;
const privateKeyPath = process.env.PRIVATE_KEY_PATH;

// This reads the contents of your private key file.
const privateKey = fs.readFileSync(privateKeyPath, "utf8");

// This creates a new instance of the Octokit App class.
const app = new App({
  appId: appId,
  privateKey: privateKey,
  webhooks: {
    secret: webhookSecret
  },
});

// OAuth token for Github to use with graphql
const token = process.env.TOKEN;
const owner = process.env.REPOSITORY_OWNER;
const repo = process.env.REPOSITORY_NAME;
console.log(repo);
const auth = {
    headers: {
        authorization: 'token ' + token,
        'Content-Type': 'application/json'
    }
};

const niceRequest = async (q, a) => await graphql(q, a);

// Try to get the project ID here
const proj_id = process.env.CURRENT_PROJECT_ID;
var projbyname = `query findProjectwithName {
    user(login: "KathrynBaker") {
        projectsV2(first: 10, query: "@KathrynBaker's actions test project") {
            nodes {
                id
            }
        }
    }
}`
let p_query = niceRequest(projbyname, auth);
var p_two;
console.log('About to try setting p2, it is currently:' + p_two);
p_query.then(function (result) { setPtwo(result) });
console.log(`p2 may have set:` + p_two);

function setPtwo(result) {
    p_two = result;
    console.log(result);
    console.log('p2 has a value, perhaps: ' + p_two);
};

console.log('Looking again at p2: ' + p_two);

// Event handlers
async function handleAddedCard({octokit, payload}) {
  console.log(`An item has been added to the project`);

};

async function whenProposed(result) {
    console.log('Project name??: ' + p_two);
    var issue_id = result.repository.issue.id;
  var mutation1 = `mutation AddReactionToIssue {
    addReaction(input:{subjectId:"${issue_id}",content:HOORAY}) {
        reaction {
            content
        }
        subject {
            id
        }
    }
  }`

    let mutate = niceRequest(mutation1, auth);

    var setProj = `mutation setProject {
          addProjectV2ItemById(input: {
              contentId: "${issue_id}",
              projectId: "${proj_id}"
          })
          {
              item{
                  id
              }
          }
      }`
    let setProject = niceRequest(setProj, auth);
    
  };

async function handleLabeledIssue({octokit, payload}) {
  console.log(`The issue #${payload.issue.number} has gained a label: ${payload.label.name}`);
  
  if (payload.label.name == "proposal") {
    console.log(`It's a Proposal`);
    
    var getIssueNumber = `query FindIssueID {
        repository(owner:"${owner}", name:"${repo}") {
            issue(number:${payload.issue.number}) {
                id
            }
        }
    }`
    let getNumber = niceRequest(getIssueNumber, auth);
      getNumber.then(function (result) { whenProposed(result) });



  }  
};


// This sets up a webhook event listener. When your app receives a webhook event from GitHub with a `X-GitHub-Event` header value of `pull_request` and an `action` payload value of `opened`, it calls the `handlePullRequestOpened` event handler that is defined above.
app.webhooks.on("projects_v2_item.created", handleAddedCard);
app.webhooks.on("issues.labeled", handleLabeledIssue);

// This logs any errors that occur.
app.webhooks.onError((error) => {
  if (error.name === "AggregateError") {
    console.error(`Error processing request: ${error.event}`);
  } else {
    console.error(error);
  }
});

// This determines where your server will listen.
//
// For local development, your server will listen to port 3000 on `localhost`. When you deploy your app, you will change these values. For more information, see "[Deploy your app](#deploy-your-app)."
const port = 3000;
const host = 'localhost';
const path = "/api/webhook";
const localWebhookUrl = `http://${host}:${port}${path}`;

// This sets up a middleware function to handle incoming webhook events.
//
// Octokit's `createNodeMiddleware` function takes care of generating this middleware function for you. The resulting middleware function will:
//
//    - Check the signature of the incoming webhook event to make sure that it matches your webhook secret. This verifies that the incoming webhook event is a valid GitHub event.
//    - Parse the webhook event payload and identify the type of event.
//    - Trigger the corresponding webhook event handler.
const middleware = createNodeMiddleware(app.webhooks, {path});

// This creates a Node.js server that listens for incoming HTTP requests (including webhook payloads from GitHub) on the specified port. When the server receives a request, it executes the `middleware` function that you defined earlier. Once the server is running, it logs messages to the console to indicate that it is listening.
http.createServer(middleware).listen(port, () => {
  console.log(`Server is listening for events at: ${localWebhookUrl}`);
  console.log('Press Ctrl + C to quit.')
});
