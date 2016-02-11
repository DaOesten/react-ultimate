import {clone, map} from "ramda";
import Globalize from "globalize";
import Class from "classnames";
import {branch} from "baobab-react/decorators";
import React from "react";
import {Link} from "react-router";
import DocumentTitle from "react-document-title";
import api from "shared/api/robot";
import {debounce, hasValues} from "shared/helpers/common";
import {formatQuery} from "shared/helpers/jsonapi";
import {Robot} from "shared/types";
import {statics} from "frontend/helpers/react";
import actions from "frontend/actions/index";
import alertActions from "frontend/actions/alert";
import {ShallowComponent, DeepComponent, ItemLink, NotFound} from "frontend/components/common";
import state from "frontend/state";

let DBCursor = state.select("DB", "robots");
let UICursor = state.select("UI", "robot");

let validateFormDebounced = debounce(key => {
  actions.validateEditForm(UICursor, key, Robot).catch(err => null);
}, 500);

@statics({
  loadData: () => {
    let urlParams = state.select("url").get("params");
    let id = urlParams.id;
    UICursor.set("id", id);

    actions
      .loadItem(DBCursor, UICursor, Robot, api)
      .then(() => {
        let model = UICursor.get("currentItem");
        UICursor.set("editForm", model);
        actions.resetEditForm(UICursor, Robot, model);
      });
  }
})
@branch({
  cursors: {
    havePendingRequests: ["UI", api.plural, "havePendingRequests"],
    item: ["UI", "robot", "currentItem"],
    form: ["UI", "robot", "editForm"],
    errors: ["UI", "robot", "editFormErrors"],
  },
})
export default class RobotEdit extends DeepComponent {
  handleBlur(key) {
    actions.validateEditForm(UICursor, key, Robot).catch(err => null);
  }

  handleChange(key, data) {
    actions.updateEditForm(UICursor, key, data);
    validateFormDebounced(key);
  }

  handleSubmit() {
    actions
      .validateEditForm(UICursor, "", Robot)
      .then(() => {
        return actions.editItem(DBCursor, UICursor, Robot, api);
      })
      .then(item => {
        alertActions.addItem({
          message: "Robot edited with id: " + item.id,
          category: "success",
        });
      })
      .catch(error => {
        alertActions.addItem({
          message: "Failed to edit Robot: " + error,
          category: "error",
        });
      });
  }

  handleReset() {
    let model = UICursor.get("currentItem");
    actions.resetEditForm(UICursor, Robot, model);
  }

  render() {
    let {havePendingRequests, item, form, errors} = this.props;

    if (item) {
      return (
        <DocumentTitle title={"Edit " + form.name}>
          <div>
            <Actions {...this.props}/>
            <section className="container margin-top-lg">
              <div className="row">
                <div className="col-xs-12 col-sm-3">
                  <div className="thumbnail">
                    <img src={"http://robohash.org/" + item.id + "?size=200x200"} width="200px" height="200px"/>
                  </div>
                </div>
                <div className="col-xs-12 col-sm-9">
                  <h1 className="nomargin-top">{form.name}</h1>
                  <fieldset>
                    <div className={Class("form-group", {
                      required: false,
                      error: Boolean(errors.name),
                    })}>
                      <label htmlFor="name">Name</label>
                      <input type="text"
                        value={form.name}
                        onBlur={() => this.handleBlur("name")}
                        onChange={event => this.handleChange("name", event.currentTarget.value)}
                        id="name" ref="name"
                        className="form-control"/>
                      <div className={Class("help", {
                        error: Boolean(errors.name),
                      })}>
                        {map(message => <span key="">{message}</span>, [errors.name])}
                      </div>
                    </div>

                    <div className={Class("form-group", {
                      required: false,
                      error: Boolean(errors.manufacturer),
                    })}>
                      <label htmlFor="manufacturer">Manufacturer</label>
                      <input type="text"
                        value={form.manufacturer}
                        onBlur={() => this.handleBlur("manufacturer")}
                        onChange={event => this.handleChange("manufacturer", event.currentTarget.value)}
                        id="manufacturer" ref="manufacturer"
                        className="form-control"/>
                      <div className={Class("help", {
                        error: Boolean(errors.manufacturer),
                      })}>
                        {map(message => <span key="">{message}</span>, [errors.manufacturer])}
                      </div>
                    </div>

                    <div className={Class("form-group", {
                      required: false,
                      error: Boolean(errors.assemblyDate),
                    })}>
                      <label htmlFor="assemblyDate">Assembly Date</label>
                      <input type="text"
                        value={form.assemblyDate}
                        onBlur={() => this.handleBlur("assemblyDate")}
                        onChange={event => this.handleChange("assemblyDate", event.currentTarget.value)}
                        id="assemblyDate" ref="assemblyDate"
                        className="form-control"/>
                      <div className={Class("help", {
                        error: Boolean(errors.assemblyDate),
                      })}>
                        {map(message => <span key="">{message}</span>, [errors.assemblyDate])}
                      </div>
                    </div>
                  </fieldset>
                  <div className="btn-group">
                    <button className="btn btn-default" type="button" onClick={() => this.handleReset()}>Reset</button>
                    <button className="btn btn-primary" type="button" onClick={() => this.handleSubmit()} disabled={hasValues(errors)}>Submit</button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </DocumentTitle>
      );
    } else if (havePendingRequests) {
      return null;
    } else {
      return <NotFound/>;
    }
  }
}

class Actions extends ShallowComponent {
  render() {
    let {item} = this.props;
    let query = formatQuery({
      filters: UICursor.get("filters"),
      sorts: UICursor.get("sorts"),
      offset: UICursor.get("offset"),
      limit: UICursor.get("limit"),
    });

    return (
      <div className="actions">
        <div className="container">
          <div className="btn-group btn-group-sm pull-left">
            <Link to="robot-index" query={query} className="btn btn-gray-light" title="Back to list">
              <span className="fa fa-arrow-left"></span>
              <span className="hidden-xs margin-left-sm">Back to list</span>
            </Link>
          </div>
          <div className="btn-group btn-group-sm pull-right">
            <Link to="robot-add" className="btn btn-sm btn-green" title="Add">
              <span className="fa fa-plus"></span>
            </Link>
            <ItemLink to="robot-detail" params={{id: item.id}} className="btn btn-blue" title="Detail">
              <span className="fa fa-eye"></span>
            </ItemLink>
            <a className="btn btn-red" title="Remove" onClick={() => actions.removeItem(item.id)}>
              <span className="fa fa-times"></span>
            </a>
          </div>
        </div>
      </div>
    );
  }
}
