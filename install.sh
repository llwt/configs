#!/bin/zsh
# Initial version stolen from thoughtbot/dotfiles/install.sh

for name in dotfiles/*; do

  # Strip "dotfiles/" out of target file name
  targetName=${name#dotfiles/}
  target="$HOME/.${targetName}"

  if [ -e "$target" ]; then
    if [ ! -L "$target" ]; then
      echo "WARNING: $target exists but is not a symlink."
    fi
  else
    if [ "$targetName" != 'install.sh' ] && [ "$targetName" != 'README.md' ]; then
      echo "Creating $target"
      ln -s "$PWD/$name" "$target"
    fi
  fi
done

# Link zsh theme
ln -sf ./zsh/solarized-powerline.zsh-theme ~/.oh-my-zsh/themes/solarized-powerline.zsh-theme

# clone vundle if necessary
if [ ! -d ~/.vim/bundle/vundle ]; then
    git clone https://github.com/gmarik/vundle.git ~/.vim/bundle/vundle
fi

# add dictionary for vim NOTE: vim doesn't seem to like symlinks to this file
ln -f ./vim/spell/en.utf-8.add ~/.vim/bundle/vundle/spell/en.utf-8.add

vim -u ~/.vimrc.before +BundleInstall +qa
