// These are the dependencies for this file.
//
// You installed the `dotenv` and `octokit` modules earlier. The `@octokit/webhooks` is a dependency of the `octokit` module, so you don't need to install it separately. The `fs` and `http` dependencies are built-in Node.js modules.
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

// This defines the message that your app will post to pull requests.
const messageForNewPRs = "Thanks for opening a new PR! Please follow our contributing guidelines to make your PR easier to review.";


// KVLB Additions
const query = `query get_info {
  repository(owner:"KathrynBaker", name:"foxlease-bunting") {
    issues(last:20, states:CLOSED) {
      edges {
        node {
          title
          url
          labels(first:5) {
            edges {
              node {
                name
              }
            }
          }
        }
      }
    }
  }
}
`;



const token = process.env.TOKEN;
const auth = {
    headers: {
        authorization: 'token ' + token,
        Accept: 'application/vnd.github.starfox-preview+json',
        'Content-Type': 'application/json'
    }
};

const niceRequest = async (q, a) => await graphql(q, a);


// Event handlers
async function handleAddedCard({octokit, payload}) {
  console.log(`An item has been added to the project`);

};

var issue_id = "Not set yet";

function something(result) {
  console.log(`Here is a function, and what it received: `+result);
};

async function tetherend(result) {
  console.log(`At the end of my tether`);
  issue_id = result.repository.issue.id; 
  console.log(issue_id)
  
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

    let unhappy = niceRequest(mutation1, auth);
    
    console.log(`Aftr the mutation I hope`);
  };

async function handleLabeledIssue({octokit, payload}) {
  console.log(`The issue #${payload.issue.number} has gained a label: ${payload.label.name}`);

  //let testOne = niceRequest(query, auth);
  //console.log(testOne);
  
  //testOne.then(function(result) {console.log(result)});
  
  if (payload.label.name == "proposal") {
    console.log(`It's a Proposal`);
    
    var query1 = `
    query FindIssueID {
  repository(owner:"KathrynBaker", name:"foxlease-bunting") {
    issue(number:${payload.issue.number}) {
      id
    }
  }
}`
    //await graphql(query1, auth)
    let testTwo = niceRequest(query1, auth);
    //console.log(testTwo);
    //var test = testTwo.then(data => issue_id);
    //testTwo.then(function(result) {issue_id = result; console.log(issue_id)});
    testTwo.then(function(result) {tetherend(result)});
    //var issue_id = testTwo.then(something(result));//.repository.issue.id;
    //var issue_id = "Not there yet";
    //issue_id = testTwo.then(function(result) {return result.repository.issue.id});
    console.log(`this is the outside one ` + issue_id);
   

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
