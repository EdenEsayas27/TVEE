const fs = require('fs');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = 'token.json';

let globalAuthClient = null;

function initGoogleAuth(callback) {
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.error('Error loading client secret file:', err);

    const credentials = JSON.parse(content);
    const { client_secret, client_id, redirect_uris } = credentials.web;

    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return callback(null, oAuth2Client); // Token missing
      oAuth2Client.setCredentials(JSON.parse(token));
      globalAuthClient = oAuth2Client;
      callback(globalAuthClient, null);
    });
  });
}

async function createMeetingLink(scheduledDate) {
  return new Promise((resolve, reject) => {
    if (!globalAuthClient) return reject(new Error("Not authorized"));

    const calendar = google.calendar({ version: 'v3', auth: globalAuthClient });

    const startTime = new Date(scheduledDate);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1-hour meeting

    const event = {
      summary: 'TVEE Meeting',
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'UTC',
      },
      conferenceData: {
        createRequest: {
          requestId: 'meet-' + Math.random().toString(36).substring(2, 15),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    calendar.events.insert(
      {
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1,
      },
      (err, result) => {
        if (err) return reject(err);

        const meetLink = result.data.conferenceData.entryPoints.find(
          (ep) => ep.entryPointType === 'video'
        ).uri;

        resolve(meetLink);
      }
    );
  });
}



module.exports = { initGoogleAuth, createMeetingLink };
