import { google } from 'googleapis';

export async function getGooglePeopleClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.people({ version: 'v1', auth });
}

export async function fetchGoogleContacts(accessToken: string) {
  const people = await getGooglePeopleClient(accessToken);
  const response = await people.people.connections.list({
    resourceName: 'people/me',
    pageSize: 1000,
    personFields: 'names,phoneNumbers,emailAddresses,metadata',
  });
  
  return response.data.connections || [];
}

export async function createGoogleContact(accessToken: string, clientData: any) {
  const people = await getGooglePeopleClient(accessToken);
  
  await people.people.createContact({
    requestBody: {
      names: [{ givenName: clientData.nombre }],
      phoneNumbers: [{ value: clientData.telefono }],
      emailAddresses: clientData.email ? [{ value: clientData.email }] : [],
      userDefined: [
        { key: 'Source', value: 'Taylor CRM' },
        { key: 'Notes', value: clientData.compiledNotes || '' }
      ]
    }
  });
}
