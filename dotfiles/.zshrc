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
  git
  fnm
  zsh-autosuggestions
  zsh-dircolors-solarized
)

source $ZSH/oh-my-zsh.sh

# Preferred editor for local and remote sessions
if [[ -n $SSH_CONNECTION ]]; then
  export EDITOR='vim'
else
  export EDITOR='code -w'
fi

# Fix GPG cli commands
# Setup instructions reminder: https://gist.github.com/webframp/75c680930b6b2caba9a1be6ec23477c1
export GPG_TTY=$(tty)

# Tab completion to use ls colors
zstyle ':completion:*' list-colors "${(@s.:.)LS_COLORS}"
autoload -Uz compinit
compinit

# local scripts
export PATH=$HOME/.bin:$PATH

# fnm
export PATH=$HOME/.fnm:$PATH
eval "`fnm env`"

# Fuzzy search
[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh

# increse command history 
HISTSIZE=999999999
SAVEHIST=$HISTSIZE
setopt histignorealldups

# ZSH Syntax highlighting
source /usr/local/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

# Fly.io
if [ -d "$HOME/.fly" ]; then
  export FLYCTL_INSTALL="$HOME/.fly"
  export PATH="$FLYCTL_INSTALL/bin:$PATH"
fi

# environment specific configurations
[ -f ~/.zshrc.local ] && source ~/.zshrc.local