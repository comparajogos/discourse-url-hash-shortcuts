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
    next(() => {
      const topicController = api.container.lookup("controller:topic");
      const topic = topicController.get("model");

      if (topic && action) {
        if (!api.getCurrentUser()) {
          cookie("destination_url", window.location.href);
          api.container.lookup("route:application").send("showLogin");
        }

        const post = topic
          .get("postStream.posts")
          .findBy("post_number", topic.get("current_post_number"));
        if (action === Composer.EDIT) {
          topicController.send("editPost", post);
        } else {
          topicController.send("replyToPost", post);
        }
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
