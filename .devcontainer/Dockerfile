FROM node:22


ARG TZ
ENV TZ="$TZ"

# Install basic development tools and Electron dependencies
RUN apt update && apt install -y \
  less \
  ca-certificates \
  wget \
  unzip \
  file \
  net-tools \
  git \
  libudev1 \
  procps \
  sudo \
  fzf \
  zsh \
  man-db \
  gnupg2 \
  gh \
  jq \
  curl \
  lsb-release \
  software-properties-common \
  build-essential \
  libnss3-tools \
  lsof \
  netcat-openbsd \
  # X11 and Electron dependencies
  libx11-xcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxi6 \
  libxtst6 \
  libnss3 \
  libxss1 \
  libxrandr2 \
  libasound2 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libgtk-3-0 \
  libgbm1 \
  libdrm2 \
  libatspi2.0-0 \
  xvfb \
  dbus \
  dbus-x11 \
  # GPU/DRM support packages
  libgl1-mesa-glx \
  libgl1-mesa-dri \
  libglu1-mesa \
  libegl1-mesa \
  libglvnd0 \
  libglx0 \
  mesa-utils \
  mesa-vulkan-drivers \
  && rm -rf /var/lib/apt/lists/*



# Ensure default node user has access to /usr/local/share
RUN mkdir -p /usr/local/share/npm-global && \
  chown -R node:node /usr/local/share

ARG USERNAME=node

# Add node user to docker group for Docker access
RUN groupadd -f docker && usermod -aG docker $USERNAME

# Allow node to use sudo without a password
RUN usermod -aG sudo $USERNAME && \
    echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/$USERNAME && \
    chmod 0440 /etc/sudoers.d/$USERNAME

# Persist bash history.
RUN SNIPPET="export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.bash_history" \
  && mkdir /commandhistory \
  && touch /commandhistory/.bash_history \
  && chown -R $USERNAME /commandhistory

# Set `DEVCONTAINER` environment variable to help with orientation
ENV DEVCONTAINER=true

# Create workspace and config directories and set permissions
RUN mkdir -p /workspace /home/node/.claude && \
  chown -R node:node /workspace /home/node/.claude

WORKDIR /workspace

RUN ARCH=$(dpkg --print-architecture) && \
  wget "https://github.com/dandavison/delta/releases/download/0.18.2/git-delta_0.18.2_${ARCH}.deb" && \
  sudo dpkg -i "git-delta_0.18.2_${ARCH}.deb" && \
  rm "git-delta_0.18.2_${ARCH}.deb"

RUN wget -qO- https://astral.sh/uv/install.sh | sh && \
  mv /root/.local/bin/uv /usr/local/bin/uv

# Install mkcert directly from GitHub releases
RUN ARCH=$(dpkg --print-architecture) && \
  MKCERT_VERSION="v1.4.4" && \
  wget -qO /tmp/mkcert "https://github.com/FiloSottile/mkcert/releases/download/${MKCERT_VERSION}/mkcert-${MKCERT_VERSION}-linux-${ARCH}" && \
  chmod +x /tmp/mkcert && \
  mv /tmp/mkcert /usr/local/bin/mkcert

# Set up non-root user
USER node

# Install global packages
ENV NPM_CONFIG_PREFIX=/usr/local/share/npm-global
ENV PATH=$PATH:/usr/local/share/npm-global/bin

# Set the default shell to zsh rather than sh
ENV SHELL=/bin/zsh

# Default powerline10k theme
RUN sh -c "$(wget -O- https://github.com/deluan/zsh-in-docker/releases/download/v1.2.0/zsh-in-docker.sh)" -- \
  -p git \
  -p fzf \
  -a "source /usr/share/doc/fzf/examples/key-bindings.zsh" \
  -a "source /usr/share/doc/fzf/examples/completion.zsh" \
  -a "export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.bash_history" \
  -a "alias claude-yolo='claude --dangerously-skip-permissions'" \
  -x

# Install Claude
RUN npm install -g @anthropic-ai/claude-code

USER node