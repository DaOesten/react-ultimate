import {filter, find, forEach, identity, keys, map, pipe, propEq, slice, sortBy, tap, values} from "ramda";
import Baobab from "baobab";
import throttle from "lodash.throttle";
import {filterByAll, sortByAll} from "shared/helpers/common";
import {parseQuery} from "shared/helpers/jsonapi";
import {ALERT, ROBOT, MONSTER} from "shared/constants";
import robotApi from "shared/api/robot";
import monsterApi from "shared/api/robot";

let monkey = Baobab.monkey;

let getCurrentItems = function(DB, UI) {
  let {filters, sorts, offset, limit, ids, fullLoad} = UI;
  let itemsArray = map(id => id && DB[id], ids);
  return pipe(
    fullLoad ? filterByAll(filters) : identity,
    fullLoad ? sortByAll(sorts) : identity,
    slice(offset, offset + limit),
    filter(m => m)
  )(itemsArray);
};
let getCurrentItem = function(DB, UI) {
  return DB[UI.id];
};
let getFullLoad = function(total, ids) {
  let loaded = filter(id => id, ids).length;
  if (loaded < total) {
    return false;
  } else if (loaded == total) {
    return true;
  } else {
    throw Error(`invalid total ${total}`);
  }
};

window._state = new Baobab(
  {
    url: {
      route: undefined,
      path: undefined,
      params: {},
      query: {},
    },

    ajaxQueue: [],

    alertQueue: [],
    alertTimeout: undefined,

    DB: {
      robots: {},
      monsters: {},
    },

    UI: {
      robots: {
        total: 0,
        ids: [],

        // INDEX
        filters: ROBOT.index.filters,
        sorts: ROBOT.index.sorts,
        offset: ROBOT.index.offset,
        limit: ROBOT.index.limit,
        // filterForm ???
        // filterFormErrors ???

        // FACETS
        havePendingRequests: monkey([
          ["ajaxQueue"],
          function (queue) {
            return ajaxQueueContains(queue, robotApi.indexUrl);
          }
        ]),
        fullLoad: monkey([
          ["UI", "robots", "total"],
          ["UI", "robots", "ids"],
          function (total, ids) {
            return getFullLoad(total, ids);
          }
        ]),
        currentItems: monkey([
          ["DB", "robots"],
          ["UI", "robots"],
          function (DB, UI) {
            return getCurrentItems(DB, UI);
          }
        ]),
      },
      robot: {
        // CRUD
        id: undefined,
        addForm: {},
        addFormErrors: {},
        editForm: {},
        editFormErrors: {},

        currentItem: monkey([
          ["DB", "robots"],
          ["UI", "robot"],
          function (DB, UI) {
            return getCurrentItem(DB, UI);
          }
        ]),
      },

      monsters: {
        total: 0,
        ids: [],

        // INDEX
        filters: MONSTER.index.filters,
        sorts: MONSTER.index.sorts,
        offset: MONSTER.index.offset,
        limit: MONSTER.index.limit,
        // filterForm ???
        // filterFormErrors ???

        // FACETS
        havePendingRequests: monkey([
          ["ajaxQueue"],
          function (queue) {
            return ajaxQueueContains(queue, monsterApi.indexUrl);
          }
        ]),
        fullLoad: monkey([
          ["UI", "monsters", "total"],
          ["UI", "monsters", "ids"],
          function (total, ids) {
            return getFullLoad(total, ids);
          }
        ]),
        currentItems: monkey([
          ["DB", "monsters"],
          ["UI", "monsters"],
          function (DB, UI) {
            return getCurrentItems(DB, UI);
          }
        ]),
      },
      monster: {
        // CRUD
        id: undefined,
        addForm: {},
        editForm: {},
        addFormErrors: {},
        editFormErrors: {},
        currentItem: monkey([
          ["DB", "monsters"],
          ["UI", "monster"],
          function (DB, UI) {
            return getCurrentItem(DB, UI);
          }
        ]),
      },
    },

    urlQuery: monkey([
      ["url", "query"],
      function (query) {
        let {filters, sorts, offset, limit} = parseQuery(query);
        return {filters, sorts, offset, limit};
      }
    ]),
  },
  { // OPTIONS
    immutable: process.env.NODE_ENV != "production",
  }
);

function ajaxQueueContains(queue, url) {
  return Boolean(filter(pendindRequest => pendindRequest.url.startsWith(url), queue).length);
}

export default window._state;
