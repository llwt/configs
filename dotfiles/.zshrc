# Prevent "git_prompt_info:20: character not in range" on work laptop
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

export ZSH="$HOME/.oh-my-zsh"

# See https://github.com/ohmyzsh/ohmyzsh/wiki/Themes
ZSH_THEME="bullet-train"

BULLETTRAIN_PROMPT_ORDER=(
  time
  status
  custom
  # context
  dir
  screen
  perl
  ruby
  virtualenv
  nvm
  aws
  go
  rust
  elixir
  git
  hg
  cmd_exec_time
)

# Uncomment the following line to display red dots whilst waiting for completion.
# You can also set it to another string to have that shown instead of the default red dots.
# e.g. COMPLETION_WAITING_DOTS="%F{yellow}waiting...%f"
# Caution: this setting can cause issues with multiline prompts in zsh < 5.7.1 (see #5765)
COMPLETION_WAITING_DOTS="true"

# Uncomment the following line if you want to disable marking untracked files
# under VCS as dirty. This makes repository status check for large repositories
# much, much faster.
DISABLE_UNTRACKED_FILES_DIRTY="true"

# Which plugins would you like to load?
# Standard plugins can be found in $ZSH/plugins/
# Custom plugins may be added to $ZSH_CUSTOM/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
# Add wisely, as too many plugins slow down shell startup.
plugins=(
  colored-man-pages
  git
  fnm
  zsh-autosuggestions
  zsh-dircolors-solarized
  zsh-syntax-highlighting
)

source $ZSH/oh-my-zsh.sh

# Preferred editor for local and remote sessions
if [[ -n $SSH_CONNECTION ]]; then
  export EDITOR='vim'
else
  export EDITOR='code -w'
fi

# Load aliases
source $HOME/src/llwt/configs/dotfiles/aliases

# Homebrew if we're on OSX -- Need this before plugins
if [ -d "/opt/homebrew" ]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
fi

# Fix GPG cli commands
# Setup instructions reminder: https://gist.github.com/webframp/75c680930b6b2caba9a1be6ec23477c1
export GPG_TTY=$(tty)

# Tab completion to use ls colors
zstyle ':completion:*' list-colors "${(@s.:.)LS_COLORS}"
autoload -Uz compinit
compinit

# Edit things with vscode
export EDITOR="code --wait"
export VISUAL="$EDITOR"

# local scripts
export PATH=$HOME/.bin:$PATH

# increse command history 
HISTSIZE=999999999
SAVEHIST=$HISTSIZE
setopt histignorealldups

# Enable fnm when present
export PATH=$PATH:~/.fnm
if command -v fnm > /dev/null; then
  eval "$(fnm env --use-on-cd)"
fi

# Enable fzf when present
[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh

# Fly.io
if [ -d "$HOME/.fly" ]; then
  export FLYCTL_INSTALL="$HOME/.fly"
  export PATH="$FLYCTL_INSTALL/bin:$PATH"
fi

if [ -d "$HOME/.pyenv" ]; then
  export PYENV_ROOT="$HOME/.pyenv"
  export PATH="$PYENV_ROOT/bin:$PATH"
  eval "$(pyenv init --path)"
fi

if command -v zoxide > /dev/null; then
  eval "$(zoxide init zsh --cmd cd)"
fi

# environment specific configurations
if [ -f ~/.zshrc.local ]; then
  source ~/.zshrc.local
fi

