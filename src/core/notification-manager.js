import UtilsNew from "./utilsNew.js";

export default class NotificationManager {

    constructor(config) {
        this._init(config);
    }

    // Initialize the notification manager
    _init(config) {
        this.config = {...this.getDefaultConfig(), ...config};

        // Initialize notifications parent
        this.parent = document.createElement("div");
        this.parent.classList.add("notification-manager");
        Object.assign(this.parent.style, {
            "left": "50%",
            "maxWidth": this.config.display?.width || "600px",
            "position": "fixed",
            "top": "8px",
            "transform": "translateX(-50%)",
            "width": "100%",
            "zIndex": "9999",
        });

        // Append notification parent to document
        document.body.appendChild(this.parent);
    }

    // Display a notification alert
    show(options) {
        const type = (options.type || "info").toLowerCase();
        const alertClass = options.display?.alertClassName || this.config.display.alertClassName[type];
        const buttonClass = options.display?.buttonClassName || this.config.display.buttonClassName[type];

        // Generate notification element
        const element = UtilsNew.renderHTML(`
            <div class="${alertClass} animated fadeInDown" style="display:flex;animation-duration:0.5s!important;">
                ${options.display?.showIcon ? `
                    <div style="margin-right:16px">
                        <span class="${options.icon || this.config.icons[type]}"></span>
                    </div>
                ` : ""}
                <div style="flex-grow:1;">
                    <div>
                        ${options.title ? `<h4 style="font-weight:bold;margin-bottom:8px;">${options.title}</h4>` : ""}
                        ${options.message ? `
                            <div style="word-break:break-all;max-height:${this.config.display.messageMaxHeight};overflow-y:auto;">
                                ${options.message}
                            </div>
                        ` : ""}
                    </div>
                    ${options.buttons && options.buttons?.length > 0 ? `
                        <div align="right" style="margin-top:12px;">
                            ${options.buttons.map((button, index) => `
                                <button data-index="${index}" class="${buttonClass}">
                                    ${button.text || ""}
                                </button>
                            `).join("")}
                        </div>
                    ` : ""}
                </div>
                ${options.display?.showCloseButton ? `
                    <div style="margin-left:16px;">
                        <button type="button" class="close" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                ` : ""}
            </div>
        `).querySelector("div.alert");

        // Method to remove the notification
        const removeNotification = () => {
            this.parent.contains(element) && this.parent.removeChild(element);
        };

        // Register buttons actions
        Array.from(element.querySelectorAll("button.btn")).forEach(buttonElement => {
            const index = parseInt(buttonElement.dataset.index);

            buttonElement.addEventListener("click", () => {
                // First call the onClick function (if provided)
                if (typeof options.buttons[index].onClick === "function") {
                    options.buttons[index].onClick(removeNotification);
                }

                // Check if we want to automatically remove the notification
                if (options.buttons[index].removeOnClick) {
                    return removeNotification();
                }
            });
        });

        // Register event to remove the notification when the close button is clicked
        if (options.display?.showCloseButton) {
            element.querySelector("button.close").addEventListener("click", () => {
                return removeNotification();
            });
        }

        // Register the timer to automatically remove the notification after the specified ms
        if (options.removeAfter > 0) {
            UtilsNew.sleep(options.removeAfter).then(() => removeNotification());
        }

        // Append notification
        this.parent.appendChild(element);
    }

    // Alias to create a success notification
    success(title, message) {
        return this.show({
            type: "success",
            display: {
                showIcon: true,
                showCloseButton: true,
            },
            removeAfter: this.config.removeAfter,
            title: title,
            message: message,
        });
    }

    // Alias to create an info notification
    info(title, message) {
        return this.show({
            type: "info",
            display: {
                showIcon: true,
                showCloseButton: true,
            },
            removeAfter: this.config.removeAfter,
            title: title,
            message: message,
        });
    }

    // Alias to create a warning notification
    warning(title, message) {
        return this.show({
            type: "warning",
            display: {
                showIcon: true,
                showCloseButton: true,
            },
            removeAfter: this.config.removeAfter,
            title: title,
            message: message,
        });
    }

    // Alias to create an error notification
    error(title, message) {
        return this.show({
            type: "error",
            display: {
                showIcon: true,
                showCloseButton: false,
            },
            removeAfter: 0,
            buttons: [
                {
                    text: "Close",
                    removeOnClick: true,
                },
            ],
            title: title,
            message: message,
        });
    }

    // Register response error listener
    // This will handle all response errors from OpenCGA and display a notification if needed
    showResponse(response) {
        // Display error response events
        if (response?.getEvents?.("ERROR")?.length) {
            response.getEvents("ERROR").forEach(error => {
                this.error(error.name, error.message);
            });
        }

        // Display warning response events
        if (response?.getEvents?.("WARNING")?.length) {
            response.getEvents("WARNING").forEach(warn => {
                this.warning(warn.name, warn.message);
            });
        }

        // Sometimes response is an instance of an error
        if (response instanceof Error) {
            this.error(response.name, response.message);
        }
    }

    // Get default config for the notification manager
    getDefaultConfig() {
        return {
            icons: {
                error: "fas fa-times-circle",
                info: "fas fa-info-circle",
                success: "fas fa-check-circle",
                warning: "fas fa-exclamation-triangle",
            },
            display: {
                width: "600px",
                messageMaxHeight: "200px",
                alertClassName: {
                    error: "alert alert-danger",
                    info: "alert alert-info",
                    success: "alert alert-success",
                    warning: "alert alert-warning",
                },
                buttonClassName: {
                    error: "btn btn-danger",
                    info: "btn btn-info",
                    success: "btn btn-success",
                    warning: "btn btn-warning",
                },
            },
            removeAfter: 5000,
        };
    }

}
