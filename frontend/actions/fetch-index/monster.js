import {addIndex, insert, map, reduce} from "ramda";
import {toObject} from "shared/helpers/common";
import {formatQueryForAxios} from "shared/helpers/jsonapi";
import api from "shared/api/monster";
import {Monster} from "shared/types";
import {parseAs} from "shared/parsers";
import state from "frontend/state";
import ajax from "frontend/ajax";

let reduceIndexed = addIndex(reduce);
let DBCursor = state.select("DB", api.plural);
let UICursor = state.select("UI", api.plural);

// Filters, Sorts, Offset, Limit -> Maybe [Monster]
export default function fetchIndex(filters, sorts, offset, limit) {
  console.debug(api.plural + `.fetchIndex(...)`);

  let query = formatQueryForAxios({filters, sorts, offset, limit});

  return ajax.get(api.indexUrl, {params: query})
    .then(response => {
      if (response.status.startsWith("2")) {
        let newItemsArray = map(m => parseAs(Monster, m), response.data.data);
        let newItems = toObject(newItemsArray);
        DBCursor.merge(newItems);
        UICursor.set("total", response.data.meta.page.total);
        UICursor.apply("pagination", ps => {
          return reduceIndexed((memo, m, i) => {
              return insert(offset + i, m.id, memo);
            }, ps, newItemsArray
          );
        });
        return newItems;
      } else {
        return [];
      }
    });
}
