import { next } from "@ember/runloop";
import { apiInitializer } from "discourse/lib/api";
import cookie from "discourse/lib/cookie";
import logout from "discourse/lib/logout";
import Composer from "discourse/models/composer";

const ACTION_REGEX = /.*#(\S+)/g;

export default apiInitializer("1.8.0", (api) => {
  const match = ACTION_REGEX.exec(window.location.href);
  const action = match?.[1];

  if ([Composer.REPLY, Composer.EDIT].includes(action)) {
    const composer = api.container.lookup("service:composer");

    next(async () => {
      const topic = api.container.lookup("controller:topic").get("model");

      if (topic && action) {
        if (!api.getCurrentUser()) {
          cookie("destination_url", window.location.href);
          api.container.lookup("route:application").send("showLogin");
        }

        const post =
          action === Composer.EDIT ? topic.postStream.posts[0] : undefined;

        await composer.open({
          action,
          draftKey: topic.get("draft_key"),
          draftSequence: topic.get("draft_sequence"),
          topic,
          post,
        });
      }
    });
  }

  if (action === "logout" && api.getCurrentUser()) {
    api
      .getCurrentUser()
      .destroySession()
      .then((response) => logout({ redirect: response["redirect_url"] }));
  }
});
