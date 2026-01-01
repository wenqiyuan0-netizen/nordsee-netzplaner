import { GridNode, GridLink, Station } from './types';

export const INITIAL_NODES: GridNode[] = [
    {
      "id": "c218a544-f360-41cf-ae4a-99dd4c221b1c",
      "position": {
        "lat": 61.97600240698788,
        "lng": 9.04519642536388
      },
      "isFixed": false,
      "name": "Neuer Knoten"
    },
    {
      "id": "4018cced-9142-4939-b609-ae0b306a6927",
      "position": {
        "lat": 62.38616205166234,
        "lng": 15.279737242659978
      },
      "isFixed": false,
      "name": "Neuer Knoten"
    },
    {
      "id": "860f726b-ddb6-41df-9c62-32203e45ba7c",
      "position": {
        "lat": 56.36022160637549,
        "lng": 9.308627727503167
      },
      "isFixed": false,
      "name": "Neuer Knoten"
    },
    {
      "id": "8e64a199-1803-4f5a-bfae-5e4aeee440a8",
      "position": {
        "lat": 55.32398002613785,
        "lng": 3.8643808166248492
      },
      "isFixed": false,
      "name": "Neuer Knoten"
    },
    {
      "id": "5af3d956-e625-4eb9-acf1-81445ceff924",
      "position": {
        "lat": 53.167677592400246,
        "lng": 6.9377460082496984
      },
      "isFixed": false,
      "name": "Neuer Knoten"
    },
    {
      "id": "3846a72a-2732-4383-afa3-ac8004d5f667",
      "position": {
        "lat": 57.746231720275745,
        "lng": 14.752874638381481
      },
      "isFixed": false,
      "name": "Neuer Knoten"
    },
    {
      "id": "8624bf7b-697d-4cf3-bc04-ef5d60402e21",
      "position": {
        "lat": 69.92718475672778,
        "lng": 19.319017208795536
      },
      "isFixed": false,
      "name": "Neuer Knoten"
    },
    {
      "id": "0b34b826-9d5e-4000-bcdb-b4032af59356",
      "position": {
        "lat": 70.72598320672355,
        "lng": 25.377937157998787
      },
      "isFixed": false,
      "name": "Neuer Knoten"
    },
    {
      "id": "6437dd82-f93c-41c4-b1ea-6174b499ce00",
      "position": {
        "lat": 67.02962036441058,
        "lng": 23.007055438745322
      },
      "isFixed": false,
      "name": "Neuer Knoten"
    },
    {
      "id": "fc35f49c-cfb0-461d-a2bf-5b476be18274",
      "position": {
        "lat": 66.12128789419772,
        "lng": 38.8129335671017
      },
      "isFixed": false,
      "name": "Neuer Knoten"
    },
    {
      "id": "8124d6f3-a788-4c89-ad24-9e7e44bb2085",
      "position": {
        "lat": 52.32191088594773,
        "lng": 13.611258804824333
      },
      "isFixed": false,
      "name": "Neuer Knoten"
    },
    {
      "id": "fd9b13ba-ee7b-419a-8f6d-6c566cb72e12",
      "position": {
        "lat": 46.73986059969267,
        "lng": 7.025476251342542
      },
      "isFixed": false,
      "name": "Neuer Knoten"
    },
    {
      "id": "be52494a-4b31-4327-a0e8-3a13485d5e81",
      "position": {
        "lat": 57.040729838360875,
        "lng": 11.591618821756594
      },
      "isFixed": false,
      "name": "Neuer Knoten"
    }
];

export const INITIAL_LINKS: GridLink[] = [
    {
      "id": "e81ed1bc-3145-4484-9dd9-57b0ecdeb7f8",
      "sourceId": "4018cced-9142-4939-b609-ae0b306a6927",
      "targetId": "c218a544-f360-41cf-ae4a-99dd4c221b1c"
    },
    {
      "id": "a6b214db-1176-4123-aa32-fb9c8b9965fa",
      "sourceId": "3846a72a-2732-4383-afa3-ac8004d5f667",
      "targetId": "4018cced-9142-4939-b609-ae0b306a6927"
    },
    {
      "id": "e8922164-9cf2-4a4a-bd8e-c6e370e32ea5",
      "sourceId": "860f726b-ddb6-41df-9c62-32203e45ba7c",
      "targetId": "8e64a199-1803-4f5a-bfae-5e4aeee440a8"
    },
    {
      "id": "03e869fc-4122-45f4-b9d9-5152523c127e",
      "sourceId": "5af3d956-e625-4eb9-acf1-81445ceff924",
      "targetId": "8e64a199-1803-4f5a-bfae-5e4aeee440a8"
    },
    {
      "id": "99313641-12f9-4e79-b712-2e8bcabf50e9",
      "sourceId": "5af3d956-e625-4eb9-acf1-81445ceff924",
      "targetId": "8124d6f3-a788-4c89-ad24-9e7e44bb2085"
    },
    {
      "id": "6cbb5ebc-eb1e-444f-86f9-793be44152b8",
      "sourceId": "5af3d956-e625-4eb9-acf1-81445ceff924",
      "targetId": "fd9b13ba-ee7b-419a-8f6d-6c566cb72e12"
    },
    {
      "id": "fc727add-bf84-4ce7-94b6-f366e9a73d06",
      "sourceId": "8124d6f3-a788-4c89-ad24-9e7e44bb2085",
      "targetId": "fd9b13ba-ee7b-419a-8f6d-6c566cb72e12"
    },
    {
      "id": "922fff63-4310-424b-901a-91c06add5ca9",
      "sourceId": "8124d6f3-a788-4c89-ad24-9e7e44bb2085",
      "targetId": "860f726b-ddb6-41df-9c62-32203e45ba7c"
    },
    {
      "id": "b6838f39-fe26-4e04-99bf-4753637284ba",
      "sourceId": "3846a72a-2732-4383-afa3-ac8004d5f667",
      "targetId": "8124d6f3-a788-4c89-ad24-9e7e44bb2085"
    },
    {
      "id": "d582edb0-f109-4073-a186-730c1a150416",
      "sourceId": "be52494a-4b31-4327-a0e8-3a13485d5e81",
      "targetId": "860f726b-ddb6-41df-9c62-32203e45ba7c"
    },
    {
      "id": "fd4bc206-f8c3-43aa-9fa4-2facebc45d3e",
      "sourceId": "c218a544-f360-41cf-ae4a-99dd4c221b1c",
      "targetId": "be52494a-4b31-4327-a0e8-3a13485d5e81"
    },
    {
      "id": "e890f35b-89e6-407c-a120-0f14da4f6c75",
      "sourceId": "4018cced-9142-4939-b609-ae0b306a6927",
      "targetId": "be52494a-4b31-4327-a0e8-3a13485d5e81"
    },
    {
      "id": "2c1f1504-cfb6-4758-909a-b46499866ce8",
      "sourceId": "c218a544-f360-41cf-ae4a-99dd4c221b1c",
      "targetId": "8624bf7b-697d-4cf3-bc04-ef5d60402e21"
    },
    {
      "id": "d52b7c3a-c362-4829-ab80-96343f1c2f1b",
      "sourceId": "0b34b826-9d5e-4000-bcdb-b4032af59356",
      "targetId": "c218a544-f360-41cf-ae4a-99dd4c221b1c"
    },
    {
      "id": "51574f7a-16c9-4fe4-95b7-57971c1ef463",
      "sourceId": "0b34b826-9d5e-4000-bcdb-b4032af59356",
      "targetId": "8624bf7b-697d-4cf3-bc04-ef5d60402e21"
    },
    {
      "id": "4766d174-3bff-453e-b011-6015435d3070",
      "sourceId": "6437dd82-f93c-41c4-b1ea-6174b499ce00",
      "targetId": "4018cced-9142-4939-b609-ae0b306a6927"
    },
    {
      "id": "383d93af-6902-4123-b2b3-031ca8e8b1eb",
      "sourceId": "6437dd82-f93c-41c4-b1ea-6174b499ce00",
      "targetId": "fc35f49c-cfb0-461d-a2bf-5b476be18274"
    },
    {
      "id": "cec5eb41-aab3-44af-bdc4-8444691113bf",
      "sourceId": "0b34b826-9d5e-4000-bcdb-b4032af59356",
      "targetId": "fc35f49c-cfb0-461d-a2bf-5b476be18274"
    }
];

export const INITIAL_STATIONS: Station[] = [
    {
      "id": "7c19764d-eb2b-4c5c-b7fa-ff5ff6e440d4",
      "type": "Hauptstandort" as any,
      "position": {
        "lat": 57.35024759105767,
        "lng": 6.7016601707571555
      },
      "connectionPoint": {
        "lat": 56.017208302500705,
        "lng": 7.506490894138311
      },
      "connectedLinkId": "e8922164-9cf2-4a4a-bd8e-c6e370e32ea5"
    },
    {
      "id": "dcfde794-791b-4790-9f48-2506bec9c697",
      "type": "Wellenkraftwerk" as any,
      "position": {
        "lat": 62.471723714758724,
        "lng": 6.013691581446055
      },
      "connectionPoint": {
        "lat": 61.97600240698788,
        "lng": 9.04519642536388
      },
      "connectedLinkId": "e81ed1bc-3145-4484-9dd9-57b0ecdeb7f8"
    },
    {
      "id": "c496ca4f-e796-4671-b8c2-bd0ee6b84cf3",
      "type": "Windpark" as any,
      "position": {
        "lat": 61.64816245852389,
        "lng": 5.48682897716752
      },
      "connectionPoint": {
        "lat": 61.73071859648728,
        "lng": 9.171754012578365
      },
      "connectedLinkId": "fd4bc206-f8c3-43aa-9fa4-2facebc45d3e"
    },
    {
      "id": "eb3c52f0-efec-487d-8fc9-7fe1fd5a04d7",
      "type": "Pumpspeicherkraftwerk" as any,
      "position": {
        "lat": 59.33318942659219,
        "lng": 6.760080270840657
      },
      "connectionPoint": {
        "lat": 56.36022160637549,
        "lng": 9.308627727503167
      },
      "connectedLinkId": "e8922164-9cf2-4a4a-bd8e-c6e370e32ea5"
    },
    {
      "id": "9c087385-4861-4dd6-92ef-9f7afd4b940f",
      "type": "Photovoltaik" as any,
      "position": {
        "lat": 56.41390137600676,
        "lng": 16.419228015947297
      },
      "connectionPoint": {
        "lat": 57.040729838360875,
        "lng": 11.591618821756594
      },
      "connectedLinkId": "d582edb0-f109-4073-a186-730c1a150416"
    },
    {
      "id": "e1a26b09-5fbd-4a56-9929-4b286863d165",
      "type": "Kältemaschine" as any,
      "position": {
        "lat": 57.43311373445069,
        "lng": 5.646972640130976
      },
      "connectionPoint": {
        "lat": 57.35024759105767,
        "lng": 6.7016601707571555
      }
    }
];